"""本机馆藏采集的来源顺序、启用状态与作品并发数。"""
from __future__ import annotations

import json
from pathlib import Path

from .fsutil import atomic_write_text
from .metadata_routes import ROUTES
from .collection_concurrency import worker_count

AVAILABLE = tuple(dict.fromkeys(source for chain in ROUTES.values() for source in chain))


def validate(raw: dict) -> dict:
    if not isinstance(raw, dict):
        raise ValueError('采集来源设置须为对象')
    result = {}
    for field in ('preferred_sources', 'disabled_sources'):
        values = raw.get(field, [])
        if not isinstance(values, list) or any(not isinstance(value, str) or value not in AVAILABLE for value in values):
            raise ValueError('请选择已登记的馆藏采集来源')
        result[field] = list(dict.fromkeys(values))
    if set(result['preferred_sources']) & set(result['disabled_sources']):
        raise ValueError('优先来源须保持启用')
    concurrency = raw.get('concurrency')
    worker_count(concurrency)
    result['concurrency'] = concurrency
    return result


def read(state_root: Path) -> dict:
    try:
        raw = json.loads((Path(state_root) / 'collection-source-policy.json').read_text(encoding='utf-8'))
    except FileNotFoundError:
        return validate({})
    return validate(raw)


def save(state_root: Path, raw: dict) -> dict:
    policy = validate(raw)
    atomic_write_text(Path(state_root) / 'collection-source-policy.json',
                      json.dumps(policy, ensure_ascii=False) + '\n')
    return policy


def order(chain, policy: dict):
    enabled = tuple(source for source in chain if source not in policy['disabled_sources'])
    preferred = tuple(source for source in policy['preferred_sources'] if source in enabled)
    return (*preferred, *(source for source in enabled if source not in preferred))
