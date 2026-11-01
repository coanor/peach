import { Chip } from '@/components/base/badges/chip';
import { useQuery } from '@tanstack/react-query';
import { Disclosure } from '../settings/section';
import { PathLine } from '../components/path-line';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { fetchLibraryProcessing, LIBRARY_PROCESSING_KEY, pollInterval, processingActive,
  type CollectionEvent, type LibraryProcessingData } from './library-processing';

const STATUS: Record<CollectionEvent['status'], string> = {
  running: '采集中', success: '成功', failed: '失败', not_found: '无结果',
  cached: '命中缓存', kept: '保留已有封面', cancelled: '已中断',
};

/** 一次采集的开始与结束合成一行，近期记录按最新事件排列。 */
export function collectionRows(events: CollectionEvent[]): CollectionEvent[] {
  const rows = new Map<string, CollectionEvent>();
  for (const [index, event] of events.entries()) {
    const key = event.attempt_id || `${event.at}-${index}`;
    rows.delete(key);
    rows.set(key, event);
  }
  return [...rows.values()].reverse();
}

export function CollectionActivity({ state, compact = false }: { state: LibraryProcessingData; compact?: boolean }) {
  const list = useOverlayScrollbar<HTMLUListElement>();
  const rows = collectionRows(state.collection_preview || []);
  if (!rows.length) return null;
  const active = processingActive(state);
  return <section aria-label="采集日志" className="flex min-w-0 flex-col gap-2 border-t border-separator-border pt-3">
    {active && state.current_source
      ? <p role="status" className="text-body-2-regular wrap-anywhere">当前来源：{state.current_source.label}</p>
      : null}
    <Disclosure summary="采集日志" defaultOpen={!compact && active} contentClassName="gap-2">
      <div className="relative">
        <ul ref={list} aria-label="近期采集记录" className="max-h-64 overflow-y-auto pr-3">
          {rows.map((event, index) => <li key={event.attempt_id || `${event.at}-${index}`}
            className="flex min-w-0 flex-col gap-1 border-b border-separator-border py-2 first:pt-0 last:border-b-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-caption-1-regular">
              <time dateTime={new Date(event.at * 1000).toISOString()} className="text-text-secondary tabular-nums">
                {new Date(event.at * 1000).toLocaleTimeString()}
              </time>
              <span className="wrap-anywhere">{event.code} · {event.label}</span>
              <Chip variant="caption" color={event.status === 'failed' ? 'rose' : event.status === 'success' ? 'lime'
                : event.status === 'running' && active ? 'blue' : 'neutral'}>
                {event.status === 'running' && !active ? '未取得结果' : STATUS[event.status]}
              </Chip>
            </div>
            <p className="text-caption-1-regular text-text-secondary wrap-anywhere">
              {event.action === 'request' ? '网络请求' : event.action === 'bridge' ? '来源查询'
                : event.action === 'fetching_cover' ? '封面' : '资料'}
              {event.http_status ? ` · HTTP ${event.http_status}` : ''}
              {event.elapsed_seconds != null ? ` · ${event.elapsed_seconds.toFixed(1)} 秒` : ''}
              {event.reason ? ` · ${event.reason}` : ''}
            </p>
          </li>)}
        </ul>
      </div>
      {state.collection_log ? <PathLine path={state.collection_log} prefix="完整日志："
        className="text-caption-1-regular text-text-secondary" /> : null}
    </Disclosure>
  </section>;
}

/** 任务中心只展示与该轮任务相同的采集快照。 */
export function TaskCollectionActivity({ runId }: { runId: number }) {
  const job = useQuery({ queryKey: LIBRARY_PROCESSING_KEY, queryFn: ({ signal }) => fetchLibraryProcessing(signal),
    refetchInterval: query => pollInterval(query.state.data, true) });
  return job.data?.run_id === runId ? <CollectionActivity state={job.data} /> : null;
}
