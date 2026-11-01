/* 数据管理页上的「扫描与采集」卡片。
 *
 * 卡片里讲的是那颗按钮此刻在做什么（进度或等待点）；结果和故障讲的是这一趟任务的下场，
 * 挂在卡片外面，和链接管理、资源同步那两块同一个写法。
 *
 * 写操作是 `useMutation`：服务端回的就是这一趟的新快照，用 `setQueryData` 换进缓存，
 * 再让这个键立刻重读一次接上轮询的节律。首屏读到的旧终态不冒充新结果——任务关掉页面
 * 照样在跑，状态里常年躺着上一趟的回执，判据在 `use-library-processing.ts`。 */
import { useEffect } from 'react';
import { RiArrowRightLine } from '@remixicon/react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/base/buttons/button';
import { LinkButton } from '@/components/base/buttons/link-button';
import { Chip } from '@/components/base/badges/chip';

import { apiSend, errorMessage } from '../../api';
import { SCAN_CARD_TEXT } from '../../management';
import type { LibraryProcessingProps } from '../bundle';
import { Fieldset, FieldsetTitle } from '../components/fieldset';
import { Note } from '../components/note';
import { StatusLabel } from '../components/status-label';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { PathLine } from '../components/path-line';
import { Disclosure } from '../settings/section';
import { queryClient } from '../query';
import {
  ALL_CONTENT_URL, DISCONNECTED_TEXT, issueDetails, LIBRARY_PROCESSING_KEY, LIBRARY_PROCESSING_URL, PARTIAL_RESULT_TEXT,
  notesLine, processingActive, processingHasPartialResult, remainingTime, slowItem, type LibraryProcessingCommand, type LibraryProcessingData,
} from './library-processing';
import { SlowItemNote } from './slow-item';
import { useLibraryProcessingJob } from './use-library-processing';
import { setProcessingNoticeVisible, useProcessingNoticeVisibility } from './processing-notice-visibility';
import { ProcessingActions } from './processing-actions';
import { ProcessingProgress } from './processing-line';
import { CollectionActivity } from './collection-activity';
import { TrafficProgress } from './processing-traffic';
import { ProcessingControls } from './processing-controls';
import { downloadIssueList, exportProcessingIssues } from './issue-export';
import { busyProps, useAction } from '../settings/use-action';

/* 中文正文写成常量：JSX 里换行的文字会在接缝处多出一个空格，中文句子里看得见。
   卡片正文与首屏骨架共用 `SCAN_CARD_TEXT`（`management.ts`）。 */
const STALLED_TEXT = '这一项耗时较长，暂时没有新进展。任务结束后可以重试未完成的部分。';
/* 补齐女优资料是落库之后的一步，一趟里常常什么都不用补，那时这句话不出现：
   四个读数全是 0 还写一句「别名 0 个」，读的人分不清是没得补还是这一步没跑。 */
const profileText = (state: LibraryProcessingData) => {
  const aliases = state.performer_aliases || 0;
  const avatars = state.performer_avatars || 0;
  const conflicts = state.performer_profile_conflicts || 0;
  const failed = state.performer_profile_failed || 0;
  if (!aliases && !avatars && !conflicts && !failed) return '';
  const parts = [`补齐女优资料：别名 ${aliases} 个，头像 ${avatars} 张`];
  if (conflicts) parts.push(`${conflicts} 项同名人物资料需要确认是否为同一人`);
  if (failed) parts.push(`${failed} 张头像未取得`);
  return `${parts.join('，')}。`;
};

const receiptText = (state: LibraryProcessingData) =>
  state.requested_stage === 'previews' ? `已生成 ${state.previews || 0} 部视频预览。`
  : `已扫描 ${state.scanned || 0} 个文件，识别 ${state.identified || 0} 个番号，`
  + `取得 ${state.candidates || 0} 组作品资料，自动保存 ${state.auto_applied || 0} 条。`
  + (state.previews ? `已生成 ${state.previews} 部视频预览。` : '')
  + profileText(state);

/** 卡片外面那一块：这一趟怎么了。逐条明细要展开才读，完整清单在状态给出的日志文件里。 */
function Outcome(
  { state, problem, settled, onRetry, toast }:
  {
    state: LibraryProcessingData; problem: string;
    settled: LibraryProcessingData | null; onRetry(): void; toast(message: string): void;
  },
) {
  const details = issueDetails(state);
  const exporter = useAction();
  const archive = useAction();
  const retryable = state.status === 'failed' && !!state.retryable_asset_ids?.length;
  const notes = notesLine(state.notes || {});
  const failed = !!problem || (!state.archived && state.status === 'failed');
  const partial = !problem && !state.archived && processingHasPartialResult(state);
  /* 同一份日志只印一处：失败提示带着问题清单时归清单，跑完只剩「7 天内不再问」时归那条提示。 */
  const logInList = failed && !!details?.log;
  const slow = slowItem(state);
  /* 清单是这一页唯一自己滚的块，原生滚动条在这儿就是一条系统灰柱子。 */
  const list = useOverlayScrollbar<HTMLUListElement>();
  return (
    /* 空着时整块收起：`aria-live` 的容器留着一条空轨道，卡片底下就凭空多出一个间距。 */
    <div aria-live="polite" className="flex flex-col gap-4 empty:hidden">
      {slow
        ? <SlowItemNote state={state} slow={slow} />
        : state.status === 'running' && state.stalled
        ? <Note tone="warning" title="处理较慢">{STALLED_TEXT}</Note>
        : null}
      {failed
        ? <Note tone={partial ? 'warning' : 'error'} className="gap-0 p-3"
            title={partial ? '处理已结束，部分项目需处理' : '处理未完成'}
            action={<div className="flex flex-wrap items-center gap-2">
              {partial ? <LinkButton href={ALL_CONTENT_URL} size="small" trailingIcon={RiArrowRightLine}>查看全部内容</LinkButton> : null}
              {retryable ? <Button variant="secondary" size="small" aria-label="立即重试未完成项" onClick={onRetry}>立即重试</Button> : null}
            </div>}
            extra={details
              /* 三层东西叠在同一块提示里：一句结论、一份清单、一条日志地址。各自之间
                 横一条自己颜色的发丝线，读的人才看得出哪一段结束了——只靠间距的话，
                 几十条同样长短的明细会连成一片。 */
              ? <div className="mt-3 border-t border-current/20 pt-3">
                  <Disclosure summary={details.label} contentClassName="gap-0">
                    {/* 轨道是滚动容器的兄弟，得有一层只裹着清单的定位祖先给它落脚。 */}
                    <div className="relative">
                      {/* 条间线画在每条自己身上，不用 `divide-y`：那一族的选择器裹在
                          `:where()` 里没有特异性，压不过岛内 `@scope` 末尾那条把所有元素
                          边框清零的 preflight，线会静默消失。 */}
                      <ul ref={list} className="max-h-96 overflow-y-auto pr-3">
                        {details.items.map((item) => (
                          <li key={item.key}
                            className="flex flex-col gap-1 border-b border-current/15 py-2 wrap-anywhere first:pt-0 last:border-b-0 last:pb-0">
                            {item.href
                              ? <a href={item.href} className="text-body-2-medium underline-offset-4 hover:underline">{item.label}</a>
                              : <span className="text-body-2-medium">{item.label}</span>}
                            <span className="text-caption-1-regular">{item.note}</span>
                            {item.hint ? <code className="text-caption-1-regular break-all">{item.hint}</code> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {details.log
                      /* 日志地址与分隔线使用次级文字色。 */
                      ? <div className="mt-3 border-t border-current/20 pt-3 text-text-secondary">
                          <PathLine path={details.log} prefix="完整记录：" className="text-caption-1-regular"
                            onRevealed={toast} />
                        </div>
                      : null}
                  </Disclosure>
                </div>
              : null}>
            {problem || state.error || '处理未完成，请重试'}
            {partial ? `\n${PARTIAL_RESULT_TEXT}` : null}
          </Note>
        : null}
      {settled?.status === 'complete'
        ? <Note tone="success" title="处理完成">{receiptText(settled)}</Note>
        : null}
      {settled?.status === 'cancelled' ? <Note tone="neutral" title="任务已停止">
        已取得的资料和预览已保留，不会自动继续这趟任务。
      </Note> : null}
      {state.archived ? <Note tone="neutral">上一趟的问题提示已归档，历史记录仍保留。</Note> : null}
      {!processingActive(state) && (state.issue_count || state.status === 'failed') ? <div className="flex flex-wrap items-center gap-2">
        {state.issue_count ? <Button variant="secondary" size="small" {...busyProps(!!exporter.busy)} onClick={() => void exporter.run('export',
          signal => exportProcessingIssues(state,signal), contents => {
            downloadIssueList(state.job_id!,contents); toast('已导出问题清单');
          })}>导出完整问题清单</Button> : null}
        {!state.archived ? <Button variant="secondary" size="small" {...busyProps(!!archive.busy)}
          onClick={() => void archive.run('archive',signal => apiSend<LibraryProcessingData>(LIBRARY_PROCESSING_URL,
            {action:'archive',job_id:state.job_id},'POST',signal), next => {
              queryClient.setQueryData(LIBRARY_PROCESSING_KEY,next); toast('已归档问题提示');
            })}>归档提示</Button> : null}
      </div> : null}
      {exporter.error || archive.error ? <Note tone="warning">{exporter.error || archive.error}</Note> : null}
      {!processingActive(state) && notes
        /* 内边距与分隔节奏和上面的失败提示同一组：两块常常叠着出现，留白不一样一眼就看得出。 */
        ? <Note tone="neutral" className="gap-0 p-3"
            extra={state.issues_log && !logInList
              /* 中性提示的分隔线跟随次级文字色。 */
              ? <div className="mt-3 border-t border-current/20 pt-3 text-text-secondary">
                  <PathLine path={state.issues_log} prefix="完整记录：" className="text-caption-1-regular"
                    onRevealed={toast} />
                </div>
              : null}>
            {notes}
          </Note>
        : null}
    </div>
  );
}

export function LibraryProcessingCard(props: LibraryProcessingProps) {
  const { toast, onComplete } = props;
  const { job, settled, forget } = useLibraryProcessingJob(props);
  const start = useMutation({
    mutationFn: (command: LibraryProcessingCommand) =>
      apiSend<LibraryProcessingData>(LIBRARY_PROCESSING_URL, command),
    onSuccess: (next) => {
      forget();
      // 回的就是这一趟的新快照，换进缓存即可；节律由这个键说了算，让它立刻重读一次接上。
      queryClient.setQueryData(LIBRARY_PROCESSING_KEY, next);
      void queryClient.invalidateQueries({ queryKey: LIBRARY_PROCESSING_KEY });
    },
  });
  // 这一趟跑完了就让遗留层重画数据管理页那几个计数：复核与候选的读数跟着它变。
  useEffect(() => { if (settled) onComplete?.() }, [settled, onComplete]);

  const state = job.data ?? { status: 'idle' };
  const noticeKey = state.job_id || 'unavailable';
  const { hidden } = useProcessingNoticeVisibility(noticeKey);
  const problem = start.error ? errorMessage(start.error)
    : job.isError ? (job.data ? DISCONNECTED_TEXT : errorMessage(job.error))
    : '';
  const busy = start.isPending || processingActive(state);

  const run = async (command: LibraryProcessingCommand) => {
    if (busy) return;
    start.reset();
    await start.mutateAsync(command);
  };
  const retry = () => {
    if (!state.job_id || !state.retryable_asset_ids?.length) return;
    void run({ job_id: state.job_id, retry: state.retryable_asset_ids }).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-4">
      <Fieldset layout="stack" label="扫描与采集" footer={
        <>
          <LinkButton href="/sources" size="small" trailingIcon={RiArrowRightLine}>来源和凭证</LinkButton>
          <LinkButton href="/settings/diagnostics" size="small" trailingIcon={RiArrowRightLine}>诊断与日志</LinkButton>
          {state.candidates
            ? <LinkButton href="/review" size="small" trailingIcon={RiArrowRightLine}>复核资料</LinkButton>
            : null}
          {/* 日常同步保留独立入口，原任务的定向重试只处理该任务的失败项。 */}
          <ProcessingActions scan busy={busy} metadataOnly={state?.metadata_only} speedMode={state.speed_mode}
            pendingCount={state.new_asset_count} onRun={run} />
        </>
      }>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <FieldsetTitle>扫描与采集</FieldsetTitle>
              {state.new_asset_count ? <Chip variant="caption" color="blue">
                <span className="tabular-nums">{state.new_asset_count.toLocaleString()} 部待补全</span>
              </Chip> : null}
            </div>
            {hidden && (processingActive(state) || state.status === 'failed' || job.isError)
              ? <Button variant="secondary" size="small" onClick={() => setProcessingNoticeVisible(noticeKey, true)}>
                  显示进度浮窗
                </Button> : null}
          </div>
          <p className="text-body-2-regular text-text-secondary">{SCAN_CARD_TEXT}</p>
          {state.status === 'paused' && !state.total
            ? <span className="self-start"><StatusLabel>已暂停</StatusLabel></span>
            : processingActive(state)
            ? <ProcessingProgress state={state} />
            : null}
          {processingActive(state) ? <p className="text-body-2-regular text-text-secondary tabular-nums" data-processing-eta="">
            {remainingTime(state)}
          </p> : null}
          {processingActive(state) ? <TrafficProgress traffic={state.traffic} /> : null}
          {processingActive(state) ? <ProcessingControls state={state} /> : null}
          <CollectionActivity state={state} />
        </div>
      </Fieldset>
      <Outcome state={state} problem={problem} settled={settled} onRetry={retry} toast={toast} />
    </div>
  );
}
