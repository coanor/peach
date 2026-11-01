"""有界并发采集；回执回到任务线程处理，成功和失败不按提交顺序互相等待。"""
from concurrent.futures import Future, ThreadPoolExecutor
from contextvars import ContextVar, copy_context
from queue import Empty, Queue
import threading

_DISPATCH = ContextVar('collection_owner_dispatch', default=None)


def on_owner(function, *args, **kwargs):
    dispatch = _DISPATCH.get()
    return dispatch(function, args, kwargs) if dispatch else function(*args, **kwargs)


class CollectionPool:
    """网络在工作线程执行；候选、日志、控制回执与检查点由调用线程处理。"""

    def __init__(self):
        self.events = Queue()
        self.lock = threading.Lock()
        self.failure = None
        self.pending = set()

    def call(self, function, args, kwargs):
        reply = Future()
        with self.lock:
            if self.failure is not None:
                raise self.failure
            self.pending.add(reply)
            self.events.put((copy_context(), function, args, kwargs, reply))
        from .task_control import parked
        try:
            with parked():
                return reply.result()
        finally:
            with self.lock:
                self.pending.discard(reply)

    def _event(self, event):
        context, function, args, kwargs, reply = event
        def apply():
            token = _DISPATCH.set(None)
            try:
                return function(*args, **kwargs)
            finally:
                _DISPATCH.reset(token)
        try:
            value = context.run(apply)
        except BaseException as error:
            reply.set_exception(error)
        else:
            reply.set_result(value)

    def _stop(self, error):
        with self.lock:
            self.failure = error
            for reply in self.pending:
                if not reply.done():
                    reply.set_exception(error)

    def run(self, jobs, work, workers):
        """最多四个在途作品组，强度下降后等现有步骤完成再领取下一组。"""
        jobs = iter(jobs)
        futures = set()
        exhausted = False
        executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix='PeachMetadata')
        def execute(job):
            token = _DISPATCH.set(self.call)
            try:
                return work(job)
            finally:
                _DISPATCH.reset(token)
        try:
            while futures or not exhausted:
                while not exhausted and len(futures) < max(1, min(4, workers())):
                    try:
                        job = next(jobs)
                    except StopIteration:
                        exhausted = True
                        break
                    context = copy_context()
                    futures.add(executor.submit(context.run, execute, job))
                try:
                    self._event(self.events.get(timeout=0.05))
                except Empty:
                    pass
                for future in tuple(futures):
                    if future.done():
                        future.result()
                        futures.remove(future)
        except BaseException as error:
            self._stop(error)
            raise
        finally:
            self._stop(InterruptedError('采集任务已结束'))
            executor.shutdown(wait=True, cancel_futures=True)
