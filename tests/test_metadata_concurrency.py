"""资料采集并发的重叠、归属、共享预算与失败提交边界。"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
import threading
import unittest
from unittest.mock import Mock, patch

from peach.collection_concurrency import CollectionPool, on_owner, worker_count
from peach.http import HttpRequest, HttpResponse
from peach.processing_control import CURRENT, ItemSkipped, ProcessingControl, processing_item
from peach.scraping_access import SourceBudgetExhausted, SourceTransport


class CollectionConcurrencyTests(unittest.TestCase):
    def test_two_assets_overlap_and_publish_on_the_task_thread(self):
        """两项请求同时在途，回执仍在调用线程串行提交。"""
        barrier = threading.Barrier(2)
        owner = threading.get_ident()
        published = []
        def work(value):
            self.assertNotEqual(threading.get_ident(), owner)
            barrier.wait(timeout=5)
            on_owner(lambda: published.append((value, threading.get_ident())))
        CollectionPool().run([1, 2], work, workers=2)
        self.assertEqual({value for value, _ in published}, {1, 2})
        self.assertEqual({thread for _, thread in published}, {owner})

    def test_one_worker_runs_one_asset_at_a_time(self):
        """并发数为一时，完成回执保留提交顺序。"""
        events = []
        def work(value):
            on_owner(events.append, ('start', value))
            on_owner(events.append, ('end', value))
        CollectionPool().run(range(3), work, workers=1)
        self.assertEqual(events, [(kind, value) for value in range(3) for kind in ('start', 'end')])

    def test_cpu_default_runs_more_than_four_assets_concurrently(self):
        """CPU 自动值可同时处理六部作品。"""
        barrier = threading.Barrier(6)
        threads = set()
        def work(value):
            on_owner(threads.add, threading.get_ident())
            barrier.wait(timeout=5)
        with patch('peach.collection_concurrency.os.process_cpu_count', return_value=6):
            CollectionPool().run(range(6), work)
        self.assertEqual(len(threads), 6)

    def test_custom_worker_count_can_exceed_the_cpu_default(self):
        """自定义并发数独立于 CPU 自动值。"""
        barrier = threading.Barrier(5)
        with patch('peach.collection_concurrency.os.process_cpu_count', return_value=2):
            CollectionPool().run(range(5), lambda value: barrier.wait(timeout=5), workers=5)

    def test_cpu_detection_falls_back_and_invalid_counts_are_rejected(self):
        """CPU 数未知时至少保留一个槽位，并发数只接受正整数。"""
        with patch('peach.collection_concurrency.os.process_cpu_count', return_value=None), \
                patch('peach.collection_concurrency.os.cpu_count', return_value=3):
            self.assertEqual(worker_count(), 3)
        with patch('peach.collection_concurrency.os.process_cpu_count', return_value=None), \
                patch('peach.collection_concurrency.os.cpu_count', return_value=None):
            self.assertEqual(worker_count(), 1)
        for value in (0, -1, True, 1.5, '4'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                worker_count(value)

    def test_a_failed_commit_releases_other_waiting_workers(self):
        """公共提交失败中断整趟任务，不留下等待回执的工作线程。"""
        barrier = threading.Barrier(2)
        def commit():
            raise OSError('候选无法保存')
        def work(value):
            barrier.wait(timeout=5)
            on_owner(commit if value == 1 else lambda: None)
        with self.assertRaisesRegex(OSError, '候选无法保存'):
            CollectionPool().run([1, 2], work, workers=2)

    def test_skip_intent_belongs_to_one_concurrent_asset(self):
        """跳过一部作品不打断同时运行的另一部。"""
        with TemporaryDirectory() as folder:
            control = ProcessingControl(Path(folder).resolve() / 'control.json')
            control.select_job('job')
            token = CURRENT.set(control)
            entered, checked = threading.Barrier(2), threading.Barrier(2)
            skipped = threading.Event()
            results = []
            def work(asset_id):
                try:
                    with processing_item(asset_id):
                        entered.wait(timeout=5)
                        if asset_id == 1:
                            on_owner(control.skip_current, 'job', 1)
                            skipped.set()
                        self.assertTrue(skipped.wait(5))
                        try:
                            control.check_item()
                        except ItemSkipped:
                            results.append(('skipped', asset_id))
                        else:
                            results.append(('ok', asset_id))
                        checked.wait(timeout=5)
                except ItemSkipped:
                    pass
            try:
                CollectionPool().run([1, 2], work, workers=2)
            finally:
                CURRENT.reset(token)
            self.assertCountEqual(results, [('skipped', 1), ('ok', 2)])

    def test_providers_share_one_request_budget(self):
        """多连接共享整趟请求额度，无法把两次上限扩大成每线程两次。"""
        with TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            budget = SourceTransport(root, max_requests=2)
            transports = [SourceTransport(root, budget=budget) for _ in range(2)]
            barrier = threading.Barrier(2)
            def response(*args):
                barrier.wait(timeout=5)
                return HttpResponse(200, {}, b'ok')
            request = HttpRequest('GET', 'https://www.avbase.net/works/ABC-123', {})
            with patch.object(transports[0], '_transport_for', return_value=response), \
                    patch.object(transports[1], '_transport_for', return_value=response):
                with ThreadPoolExecutor(max_workers=2) as executor:
                    futures = [executor.submit(transport, request, 2, 100) for transport in transports]
                    self.assertEqual([future.result().body for future in futures], [b'ok', b'ok'])
                with self.assertRaises(SourceBudgetExhausted):
                    transports[0](request, 2, 100)
            self.assertEqual((budget.requests, budget.bytes, budget._reserved_bytes), (2, 4, 0))

    def test_concurrent_refusals_accumulate_source_cooldown(self):
        """同时在途的两次拒绝都计入来源冷却，不能互相覆盖。"""
        from peach.scraping_access import SourcePaused, cooldown_state
        with TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            transports = [SourceTransport(root) for _ in range(2)]
            barrier = threading.Barrier(2)
            def response(*args):
                barrier.wait(timeout=5)
                return HttpResponse(403, {}, b'blocked')
            request = HttpRequest('GET', 'https://www.avbase.net/works/ABC-123', {})
            with patch.object(transports[0], '_transport_for', return_value=response), \
                    patch.object(transports[1], '_transport_for', return_value=response):
                with ThreadPoolExecutor(max_workers=2) as executor:
                    futures = [executor.submit(transport, request, 2, 100) for transport in transports]
                    for future in futures:
                        with self.assertRaises(SourcePaused):
                            future.result()
            self.assertEqual(cooldown_state(root, 'avbase')[1], 2)

    def test_inflight_downloads_reserve_and_release_the_shared_byte_budget(self):
        """在途请求预留下载额度，完成后只扣实际字节，后续请求可继续使用余量。"""
        with TemporaryDirectory() as folder:
            root = Path(folder).resolve()
            budget = SourceTransport(root, max_bytes=10)
            first, second = (SourceTransport(root, budget=budget) for _ in range(2))
            entered, release = threading.Event(), threading.Event()
            def response(*args):
                entered.set()
                self.assertTrue(release.wait(5))
                return HttpResponse(200, {}, b'ok')
            request = HttpRequest('GET', 'https://www.avbase.net/works/ABC-123', {})
            with patch.object(first, '_transport_for', return_value=response), \
                    patch.object(second, '_transport_for', return_value=lambda *args: HttpResponse(200, {}, b'ok')):
                with ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(first, request, 2, 100)
                    try:
                        self.assertTrue(entered.wait(5))
                        with self.assertRaises(SourceBudgetExhausted):
                            second(request, 2, 100)
                    finally:
                        release.set()
                    self.assertEqual(future.result().body, b'ok')
                self.assertEqual(second(request, 2, 100).body, b'ok')
            self.assertEqual((budget.bytes, budget._reserved_bytes), (4, 0))

    def test_asset_batches_preserve_code_reuse_and_separate_completion_failures(self):
        """同番号交给同一连接依次处理，另一部失败不污染已成功影片的检查点。"""
        from peach.library_collection import collect
        barrier = threading.Barrier(2)
        owner = threading.get_ident()
        calls, published, completions = [], [], []
        state = dict(speed_mode='standard', issue_count=0, covers=0)
        rows = [dict(id=identity, code=code, name=code, path=code, title=None,
                     studio=None, release_date=None, performers=None)
                for identity, code in [(1, 'ABC-123'), (2, 'ABC-123'), (3, 'DEF-456')]]
        class Remote:
            _factory = True
            def fork(self):
                return Remote()
            def collect(self, row, code, missing, cover_root, **options):
                calls.append((row['id'], id(self)))
                if row['id'] in (1, 3):
                    barrier.wait(timeout=5)
                entries = [('javbus', {'title': code}, Path('evidence.json'))]
                options['received'](entries)
                if row['id'] == 3:
                    options['issue'](row, '来源未取得')
                if row['id'] == 2:
                    options['issue'](row, '来源告知')
                return entries, 0
            def close(self):
                pass
        def update(**values):
            self.assertEqual(threading.get_ident(), owner)
            state.update(values)
        def issue(*args, **kwargs):
            self.assertEqual(threading.get_ident(), owner)
            if args[1] != '来源告知':
                state['issue_count'] += 1
        def publish(row, code, fields, verify, entries):
            self.assertEqual(threading.get_ident(), owner)
            published.append(row['id'])
        checkpoints = Mock()
        checkpoints.queue_metadata.side_effect = lambda row, entries, before: completions.append(
            (row['id'], bool(entries) and before == state['issue_count']))
        collect([(row, row['code'], False, {}, [], True) for row in rows], Remote(), Mock(), Path('.'), [],
            state=state, completed_count=0, stages_of=lambda _: {'metadata'}, guard=Mock(), update=update,
            issue=issue, publish=publish, groups={}, poster_failed=set(), checkpoints=checkpoints,
            flush_candidates=lambda: None, scoped_groups=lambda: {}, concurrency=2)
        self.assertCountEqual(published, [1, 2, 3])
        self.assertEqual(dict(calls)[1], dict(calls)[2])
        self.assertCountEqual(completions, [(1, True), (2, True), (3, False)])
        self.assertEqual(state['checked'], 3)

    def test_worker_progress_keeps_the_paused_time_in_its_deadline(self):
        """暂停后下一条来源日志沿用已平移的单片截止时间。"""
        from peach.library_collection import collect
        with TemporaryDirectory() as folder:
            control = ProcessingControl(Path(folder).resolve() / 'control.json')
            token = CURRENT.set(control)
            row = dict(id=1, name='ABC-123', code='ABC-123', path='ABC-123')
            deadlines = []
            class Remote:
                _factory = True
                def fork(self):
                    return self
                def close(self):
                    pass
                def collect(self, *args, **options):
                    options['update'](current_started_at=10, current_deadline_at=20)
                    on_owner(setattr, control, 'paused_seconds', 100)
                    options['update'](collection_event={'active_source': {'key': 'javbus'}})
                    return [], 0
            state = dict(speed_mode='low', issue_count=0, covers=0)
            def update(**values):
                if 'collection_event' in values:
                    deadlines.append(values['current_deadline_at'])
                state.update(values)
            try:
                collect([(row, row['code'], False, {}, [], True)], Remote(), Mock(), Path('.'), [],
                    state=state, completed_count=0, stages_of=lambda _: {'metadata'}, guard=Mock(),
                    update=update, issue=Mock(), publish=Mock(), groups={}, poster_failed=set(),
                    checkpoints=Mock(), flush_candidates=lambda: None, scoped_groups=lambda: {})
            finally:
                CURRENT.reset(token)
            self.assertEqual(deadlines, [120])
