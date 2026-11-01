"""按作品分组采集；网络并发，候选、日志和完成断点回到任务线程提交。"""
import threading
import time

from .collection_concurrency import CollectionPool, on_owner


def collect(prepared, remote, traffic, cover_root, covered, *, state, completed_count,
            stages_of, guard, update, issue, publish, groups, poster_failed,
            checkpoints, flush_candidates, scoped_groups, concurrency=None):
    from .library_processing import (_answered_sources, _collect_allowed, _missing_fields,
                                    COLLECTED_FIELDS)
    pool = CollectionPool()
    sessions = []
    local = threading.local()
    batches = {}
    for entry in prepared:
        row, code, *_ = entry
        batches.setdefault(code or f"asset:{row['id']}", []).append(entry)
    if prepared and not remote._factory:
        remote._budget = remote.provider().transport.inner
    done = 0
    active = {}

    def begin(row):
        guard.check()
        active[row['id']] = dict(stage='采集缺失资料', current_asset_id=row['id'],
            current_asset_name=str(row['name'] or ''), current_action='querying_metadata',
            current_started_at=None, current_deadline_at=None, current_source=None)
        update(**active[row['id']], checked=completed_count + done,
               total=completed_count + len(prepared))

    def update_item(row, values):
        active[row['id']].update({key: value for key, value in values.items() if key in active[row['id']]})
        if event := values.get('collection_event'):
            active[row['id']]['current_source'] = event['active_source']
        update(**values)

    def record_issue(args, kwargs):
        before = state['issue_count']
        issue(*args, **kwargs)
        return state['issue_count'] != before

    def finish(entry, found, covers, had_issue, item_covered):
        nonlocal done
        row, _, _, _, local_entries, local_ok = entry
        covered.extend(item_covered)
        state['covers'] += covers
        update(stage='保存待确认资料', current_action='writing_candidates', current_asset_id=row['id'],
               current_asset_name=str(row['name'] or ''), current_started_at=time.time(), current_deadline_at=None)
        entries = local_entries + found if local_ok and row['id'] not in poster_failed else []
        checkpoints.queue_metadata(row, entries, state['issue_count'] - int(had_issue))
        flush_candidates()
        done += 1
        active.pop(row['id'])
        current = next(iter(active.values()), dict(current_asset_id=None, current_asset_name='',
            current_action='', current_started_at=None, current_deadline_at=None, current_source=None))
        update(checked=completed_count + done, candidates=len(scoped_groups()), **current)

    def work_item(entry):
        from .processing_control import CURRENT
        from .task_control import CURRENT as TASK_CONTROL
        row, code, verify, fields, *_ = entry
        on_owner(begin, row)
        progress = dict(current_asset_id=row['id'], current_asset_name=str(row['name'] or ''),
                        current_action='querying_metadata', current_started_at=None, current_deadline_at=None)
        problems = []
        control = CURRENT.get() or TASK_CONTROL.get()
        paused = control.paused_seconds if control is not None else 0
        def item_update(**values):
            nonlocal paused
            now_paused = control.paused_seconds if control is not None else 0
            for key in ('current_started_at', 'current_deadline_at'):
                if progress[key] is not None:
                    progress[key] += now_paused - paused
            paused = now_paused
            progress.update({key: value for key, value in values.items() if key in progress})
            on_owner(update_item, row, {**progress, **values})
        def item_issue(*args, **kwargs):
            if on_owner(record_issue, args, kwargs):
                problems.append(True)
        def receive(entries):
            on_owner(publish, row, code, fields, verify, entries)
        missing = list(COLLECTED_FIELDS) if verify else _missing_fields(row, fields)
        answered = () if verify else on_owner(_answered_sources, groups, f"asset:{row['id']}", missing)
        item_covered = []
        found, covers = _collect_allowed(local.remote, traffic, row, code, missing,
            stages_of(row['path']), cover_root, item_covered, update=item_update, issue=item_issue,
            answered=answered, received=receive, succeeded=lambda: not problems)
        on_owner(finish, entry, found, covers, bool(problems), item_covered)

    def work(batch):
        if not hasattr(local, 'remote'):
            local.remote = remote.fork()
            on_owner(sessions.append, local.remote)
        for entry in batch:
            work_item(entry)

    try:
        pool.run(batches.values(), work, workers=concurrency)
    finally:
        for session in sessions:
            session.close()
