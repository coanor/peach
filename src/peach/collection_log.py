"""采集任务的来源事件；完整记录落盘，任务快照仅保留近期事件。"""
from contextlib import contextmanager
from contextvars import ContextVar
import time
import uuid

from .error_reporting import redact
from .jav_cover_fetch import HostLimitedTransport


_REPORT = ContextVar('collection_report', default=None)
_ACTIVE = ContextVar('collection_source', default=None)
PREVIEW_LIMIT = 20


@contextmanager
def bind(report):
    token = _REPORT.set(report)
    try:
        yield
    finally:
        _REPORT.reset(token)


def emit(source, label, action, status, **details):
    report = _REPORT.get()
    if report is not None:
        report(dict(source=source, label=label, action=action, status=status,
                    at=time.time(), active_source=_ACTIVE.get(), **details))


@contextmanager
def attempt(source, label, action):
    """记录来源开始与最终结果，异常保持原样交还采集流程。"""
    started = time.monotonic()
    identity = uuid.uuid4().hex
    result = {'status': 'success'}
    token = _ACTIVE.set({'key': source, 'label': label})
    try:
        emit(source, label, action, 'running', attempt_id=identity)
        yield result
    except Exception as error:
        from .jav_cover_fetch import NotFound
        from .sources.base import SourceFailure
        missing = isinstance(error, NotFound) or isinstance(error, SourceFailure) and error.kind == 'not_found'
        result.update(status=result['status'] if result['status'] != 'success'
                      else 'cancelled' if isinstance(error, InterruptedError)
                      else 'not_found' if missing else 'failed',
                      reason=redact(str(error))[:1000], error_type=type(error).__name__)
        raise
    finally:
        _ACTIVE.reset(token)
        emit(source, label, action, **result, attempt_id=identity,
             elapsed_seconds=round(time.monotonic() - started, 3))


class CollectionLog:
    """追加任务日志并生成有界快照；恢复时继续追加同一文件。"""

    def __init__(self, path, state, *, resume=False):
        self.path, self.state = path, state
        if not resume:
            path.unlink(missing_ok=True)
        state['collection_log'] = str(path)
        state.setdefault('collection_preview', [])

    def record(self, record):
        import json
        event = dict(job_id=self.state['job_id'], **record)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open('a', encoding='utf-8') as stream:
            stream.write(json.dumps(event, ensure_ascii=False) + '\n')
        return [*self.state['collection_preview'], event][-PREVIEW_LIMIT:]


class CollectionTransport(HostLimitedTransport):
    """按实际请求域名记录封面与资料网络访问，不记录 URL 或请求头。"""

    def __call__(self, request, timeout, limit):
        from urllib.parse import urlsplit
        host = urlsplit(request.url).hostname or 'unknown'
        with attempt(host, host, 'request') as result:
            response = super().__call__(request, timeout, limit)
            result.update(http_status=response.status, status='success' if 200 <= response.status < 400
                          else 'not_found' if response.status == 404 else 'failed')
            return response
