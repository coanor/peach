/* 馆藏采集的来源选择与顺序；连接方式和登录凭证仍由各来源卡片管理。 */
import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { wireDragReorder } from '@peach/legacy/ui';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Select, SelectItem } from '@/components/base/select/select';
import { apiSend, errorMessage } from '../../api';
import { Note } from '../components/note';
import { queryClient } from '../query';
import { Disclosure, Footer, Help, Section, Stack } from '../settings/section';
import { busyProps } from '../settings/use-action';
import { SCRAPING_KEY, SCRAPING_SETTINGS_URL, type CollectionSourcePolicy, type ScrapingData } from './scraping';

export function SourcePolicy({ initial, toast }: {
  initial: NonNullable<ScrapingData['collection_policy']>; toast(message: string): void;
}) {
  const [policy, setPolicy] = useState<CollectionSourcePolicy>({
    preferred_sources: initial.preferred_sources, disabled_sources: initial.disabled_sources,
  });
  const save = useMutation({
    mutationFn: () => apiSend<{ collection_policy: CollectionSourcePolicy }>(SCRAPING_SETTINGS_URL,
      { collection_policy: policy }),
    onSuccess: (result) => {
      setPolicy(result.collection_policy);
      queryClient.setQueryData<ScrapingData>(SCRAPING_KEY, (current) => current && {
        ...current, collection_policy: { ...initial, ...result.collection_policy },
      });
      toast('采集来源设置已保存，从下一部影片开始使用');
    },
  });
  const saving = useRef(false);
  saving.current = save.isPending;
  const label = (source: string) => initial.sources.find((row) => row.source === source)?.label || source;
  const move = (source: string, target: number) => setPolicy((current) => {
    const order = current.preferred_sources.filter((name) => name !== source);
    order.splice(target, 0, source);
    return { ...current, preferred_sources: order };
  });
  const dragList = useCallback((node: HTMLOListElement | null) => {
    if (node) wireDragReorder(node, { selector: '[data-source-order]', attribute: 'data-source-order',
      onMove: (source: string, target: string, after: boolean) => setPolicy((current) => {
        if (saving.current) return current;
        const order = current.preferred_sources.filter((name) => name !== source);
        order.splice(order.indexOf(target) + Number(after), 0, source);
        return { ...current, preferred_sources: order };
      }),
    });
  }, [policy.preferred_sources.join(',')]);
  return <Section title="馆藏采集来源">
    <Help>优先来源按顺序查询，资料不足或封面未取得时继续使用后备来源。停用只影响馆藏采集，登录凭证和已有资料保留。</Help>
    <Stack>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="small" disabled={save.isPending} onClick={() => setPolicy((current) => ({
          ...current, preferred_sources: ['javbus', 'javdb'],
          disabled_sources: current.disabled_sources.filter((source) => !['javbus', 'javdb'].includes(source)),
        }))}>优先 JavBus 和 JavDB</Button>
        <Button variant="secondary" size="small" disabled={save.isPending}
          onClick={() => setPolicy({ preferred_sources: [], disabled_sources: [] })}>恢复内置顺序</Button>
      </div>
      {policy.preferred_sources.length ? <ol key={policy.preferred_sources.join(',')} ref={dragList}
        aria-label="优先来源顺序" className="flex flex-col gap-3">
        {policy.preferred_sources.map((source, index) => <li key={source} data-source-order={source}
          className="flex cursor-grab flex-wrap items-center justify-between gap-2 [&.drop-before]:border-t-2 [&.drop-after]:border-b-2">
          <span className="text-body-2-regular">{index + 1}. {label(source)}</span>
          <div className="flex flex-wrap gap-2">
            <Select aria-label={`${label(source)} 优先顺序`} selectedKey={String(index)} size="sm"
              onSelectionChange={(value) => move(source, Number(value))} isDisabled={save.isPending}>
              {policy.preferred_sources.map((_, rank) => <SelectItem key={rank} id={String(rank)}>第 {rank + 1} 位</SelectItem>)}
            </Select>
            <Button variant="secondary" size="small" disabled={save.isPending} onClick={() => setPolicy((current) => ({
              ...current, preferred_sources: current.preferred_sources.filter((name) => name !== source),
            }))}>设为后备</Button>
          </div>
        </li>)}
      </ol> : <Help>当前使用内置的内容类型来源顺序。</Help>}
      <Disclosure summary="后备来源与启用状态">
        <ul className="flex flex-col gap-3">
          {initial.sources.filter((row) => !policy.preferred_sources.includes(row.source)).map((row) => <li key={row.source}
            className="flex flex-wrap items-center justify-between gap-2">
            <Checkbox isSelected={!policy.disabled_sources.includes(row.source)} isDisabled={save.isPending}
              onChange={(enabled) => setPolicy((current) => ({ ...current, disabled_sources: enabled
                ? current.disabled_sources.filter((source) => source !== row.source)
                : [...current.disabled_sources, row.source] }))}>{row.label}</Checkbox>
            {row.can_prefer ? <Button variant="secondary" size="small" disabled={save.isPending || policy.disabled_sources.includes(row.source)}
              onClick={() => setPolicy((current) => ({ ...current,
                preferred_sources: [...current.preferred_sources, row.source] }))}>设为优先</Button> : null}
          </li>)}
        </ul>
      </Disclosure>
      <Help>查询仍按作品类型选择适用来源。来源偏好不改变资料复核和封面身份、尺寸检查。</Help>
      {save.error ? <Note tone="error">{errorMessage(save.error)}</Note> : null}
    </Stack>
    <Footer><Button {...busyProps(save.isPending)} onClick={() => save.mutate()}>保存采集来源</Button></Footer>
  </Section>;
}
