(function() {
	try {
		var e = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, t = new e.Error().stack;
		t && (e._sentryDebugIds = e._sentryDebugIds || {}, e._sentryDebugIds[t] = "2f2e8803-d6c2-4f13-9ed9-34e632641b06", e._sentryDebugIdIdentifier = "sentry-dbid-2f2e8803-d6c2-4f13-9ed9-34e632641b06");
	} catch {}
})();
import { Button as e, Chip as t, Disclosure as n, DownloadsPanel as r, EmptyState as i, Gg as a, HN as o, LinkButton as s, LoadingDots as c, Note as l, OV as u, Progress as d, TASKS_KEY as f, TRIGGER_LABELS as p, TaskCollectionActivity as m, __toESM as h, apiGet as g, apiSend as _, busyProps as v, cardClass as y, confirmModal as b, controlTask as x, cx as S, elapsedText as C, errorMessage as w, f1 as ee, fetchEarlier as te, fetchTasks as ne, fmtSize as T, foldByKind as re, foldRoutine as ie, followupDetail as E, followupTally as D, groupFollowups as ae, hasResultProblems as O, i2 as k, isActive as A, isRoutine as oe, latestOfKind as se, mergeFinished as j, momentText as M, notifyManager as N, pollInterval as ce, problemDestination as P, progressText as F, replaceEqualDeep as I, require_jsx_runtime as L, require_react as R, statusLabel as z, summaryItems as B, taskIssues as V, uo as le, useMutation as H, useQuery as U, useQueryClient as W } from "./peach-app.js";
import { CodeBlock as G } from "./peach-app.code-block-CyDva4Ms.js";
import { Page as K } from "./peach-app.page-QAncjzM1.js";
import { ErrorDetails as ue, ErrorExcerpt as de } from "./peach-app.error-excerpt-B8v2xEIP.js";
// node_modules/@tanstack/react-query/build/modern/useMutationState.js
var q = /* @__PURE__ */ h(R(), 1);
function fe() {
	let e;
	return (t, n) => {
		let r = [], i;
		return () => {
			let a = t.findAll(n.filters), o = a.flatMap((e) => [e, e.state]);
			return (!i || o.length !== r.length || o.some((e, t) => !Object.is(e, r[t]))) && (r = o, i = I(e, a.map((e) => n.select ? n.select(e) : e.state)), e = i), i;
		};
	};
}
function pe(e = {}, t) {
	let n = W(t).getMutationCache(), [r] = q.useState(() => fe()), i = r(n, e);
	return q.useSyncExternalStore(q.useCallback((e) => n.subscribe(N.batchCalls(e)), [n]), i, i);
}
// src/react/activity/background-issues.tsx
var J = L(), me = ["background-issues"];
function he() {
	let e = (0, q.useId)(), t = U({
		queryKey: me,
		queryFn: ({ signal: e }) => g("/api/background-issues", e),
		refetchInterval: 3e4
	}).data?.issues || [];
	return t.length ? /* @__PURE__ */ (0, J.jsxs)("section", {
		"aria-labelledby": e,
		className: "flex min-w-0 flex-col gap-3",
		children: [/* @__PURE__ */ (0, J.jsx)("h3", {
			id: e,
			className: "text-title-2-medium text-text-primary",
			children: "需要处理"
		}), /* @__PURE__ */ (0, J.jsx)("ul", {
			className: "flex min-w-0 flex-col gap-3",
			children: t.map((e) => /* @__PURE__ */ (0, J.jsx)("li", { children: /* @__PURE__ */ (0, J.jsx)(ge, { issue: e }) }, e.key))
		})]
	}) : null;
}
function ge({ issue: t }) {
	let n = W(), r = H({
		mutationFn: () => _(t.retry, {}),
		onSuccess: () => {
			n.invalidateQueries({ queryKey: me });
		}
	}), i = t.since ? `自 ${M(t.since)} 起` : `发现于 ${M(t.noticed_at)}`;
	return /* @__PURE__ */ (0, J.jsx)(l, {
		tone: "error",
		title: t.title,
		action: /* @__PURE__ */ (0, J.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2",
			children: [/* @__PURE__ */ (0, J.jsx)(s, {
				href: t.href,
				size: "small",
				trailingIcon: k,
				children: t.link_label
			}), t.retry ? /* @__PURE__ */ (0, J.jsx)(e, {
				variant: "secondary",
				size: "small",
				disabled: !t.retry_available,
				...v(r.isPending),
				onClick: () => r.mutate(),
				children: "立即重试"
			}) : null]
		}),
		children: r.error ? `${i}\n没有重试：${w(r.error)}` : i
	});
}
// src/react/activity/task-controls.tsx
var Y = ["task-control"], _e = {
	pause: u,
	resume: a,
	cancel: o
}, ve = {
	pause: "暂停",
	resume: "继续",
	cancel: "取消"
}, ye = {
	pause: "暂停后续任务",
	resume: "继续后续任务",
	cancel: "取消后续任务"
};
function be() {
	let e = pe({
		filters: { mutationKey: Y },
		select: (e) => ({
			id: e.mutationId,
			command: e.state.variables,
			status: e.state.status,
			error: e.state.error
		})
	}), t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.command;
		if (!e) continue;
		let r = t.get(e.id);
		(!r || r.id < n.id) && t.set(e.id, {
			...n,
			command: e
		});
	}
	let n = [...t.values()].filter((e) => e.status === "error");
	return n.length ? /* @__PURE__ */ (0, J.jsx)("div", {
		"data-task-control-feedback": "",
		className: "flex min-w-0 flex-col gap-2",
		children: n.map(({ command: e, error: t }) => /* @__PURE__ */ (0, J.jsx)(l, {
			tone: "error",
			title: `${e.label}：${(e.followups ? ye : ve)[e.action]}未完成`,
			children: w(t)
		}, e.id))
	}) : null;
}
function xe({ run: t }) {
	let n = W(), r = (0, q.useRef)({
		change: !1,
		cancel: !1,
		confirmation: !1
	}), i = () => {
		n.invalidateQueries({ queryKey: f });
	}, a = (e) => x(e.id, e.action), o = H({
		mutationKey: [
			...Y,
			t.id,
			"change"
		],
		mutationFn: a,
		onSettled: () => {
			r.current.change = !1, i();
		}
	}), s = H({
		mutationKey: [
			...Y,
			t.id,
			"cancel"
		],
		mutationFn: a,
		onSettled: () => {
			r.current.cancel = !1, i();
		}
	}), c = t.control?.actions || [], l = !A(t), u = s.isPending || s.isSuccess;
	if (!c.length) return null;
	let d = (e) => {
		let n = {
			id: t.id,
			label: t.task_label,
			action: e,
			followups: l
		};
		if (e === "cancel") {
			if (r.current.cancel || r.current.confirmation || s.isSuccess) return;
			r.current.confirmation = !0, b({
				title: l ? `取消「${t.task_label}」的全部后续任务` : `取消任务「${t.task_label}」`,
				body: l ? "将停止这轮已派出的全部后续任务，包括正在处理和排队的项目。已保存的资料和结果会保留。这批后续任务取消后不能继续，需要时重新发起。" : "将停止这轮剩余的处理及其后续任务。已保存的资料和结果会保留。这轮任务取消后不能继续，需要时重新发起。",
				confirmLabel: l ? "取消后续任务" : "取消任务",
				danger: !0,
				onConfirm: async () => (r.current.cancel = !0, await s.mutateAsync(n))
			}).finally(() => {
				r.current.confirmation = !1;
			});
		} else {
			if (r.current.change || r.current.cancel || u) return;
			r.current.change = !0, o.mutate(n);
		}
	};
	return /* @__PURE__ */ (0, J.jsx)("div", {
		className: "ml-auto shrink-0",
		"data-task-controls": t.id,
		children: /* @__PURE__ */ (0, J.jsx)("div", {
			role: "group",
			"aria-label": `${t.task_label}${l ? "后续任务" : "任务"}控制`,
			className: "flex items-center justify-end gap-2",
			children: c.map((t) => {
				let n = (l ? ye : ve)[t], r = t === "cancel" ? s.isPending : o.isPending && o.variables?.action === t, i = t === "cancel" ? u : o.isPending || u;
				return /* @__PURE__ */ (0, J.jsx)(e, {
					type: "button",
					variant: "secondary",
					size: "small",
					iconOnly: !0,
					leadingIcon: _e[t],
					"aria-label": n,
					title: n,
					...v(r),
					"aria-disabled": i || void 0,
					onClick: () => d(t),
					"data-tooltip-copy-key": `tasks.control.action.${l ? "followups." : ""}${t}`
				}, t);
			})
		})
	});
}
// src/react/activity/resource-chip.tsx
var Se = {
	blue: "bg-status-blue-text text-background-primary-default",
	purple: "bg-status-purple-text text-background-primary-default",
	cyan: "bg-status-cyan-text text-background-primary-default"
};
function Ce({ color: e, high: n, ...r }) {
	return n ? /* @__PURE__ */ (0, J.jsx)("span", {
		...r,
		className: S("inline-flex items-center justify-center rounded-md px-1.5 py-1 whitespace-nowrap text-caption-1-medium", Se[e])
	}) : /* @__PURE__ */ (0, J.jsx)(t, {
		variant: "caption",
		color: e,
		...r
	});
}
// src/react/activity/task-resources.tsx
var we = {
	cpu: {
		name: "CPU",
		color: "blue",
		description: "CPU 使用率以执行端可用容量为 100%，容器按可见 CPU 配额计算。达到 50% 时加深显示。"
	},
	gpu: {
		name: "GPU",
		color: "purple",
		description: "GPU 使用率显示该任务最忙的 GPU 引擎。达到 50% 时加深显示。"
	},
	network: {
		name: "网络",
		color: "cyan",
		description: "网络速率显示该任务已观测的下载速度，达到 10 MiB/s 时加深显示。挂载盘或无法准确归属的传输显示未取得。"
	}
};
function Te(e) {
	return e === "sampling" ? "采样中" : "未取得";
}
function Ee({ run: e, active: t = A(e) || !!e.control }) {
	if (!t || !e.resources) return null;
	let n = e.resources;
	return /* @__PURE__ */ (0, J.jsx)("div", {
		"data-task-resources": e.id,
		className: "flex min-w-0 flex-wrap items-center gap-2",
		children: [
			"cpu",
			"gpu",
			"network"
		].map((e) => {
			let t = n[e], r = we[e], i = e === "network" ? n.network.bytes_per_second : n[e].percent, a = t.state === "ready" && i !== null, o = a && t.high, s = a ? e === "network" ? `${T(i)}/s` : `${i.toLocaleString(void 0, { maximumFractionDigits: 1 })}%` : Te(t.state), c = [
				t.reason,
				o ? "当前为高占用。" : "",
				r.description,
				n.detail
			].filter(Boolean).join("\n");
			return /* @__PURE__ */ (0, J.jsxs)(Ce, {
				color: r.color,
				high: o,
				tabIndex: 0,
				title: c,
				"data-task-resource": e,
				"data-resource-state": t.state,
				"data-resource-high": o || void 0,
				"data-copy-ignore": "",
				"data-tooltip-copy-key": !t.reason && !n.detail && !o ? `tasks.resources.${e}.description` : void 0,
				children: [
					r.name,
					" ",
					s
				]
			}, e);
		})
	});
}
// src/react/activity/activity-page.tsx
var De = 50, Oe = /* @__PURE__ */ new Set(["upgrade-repairs"]), ke = {
	succeeded: "lime",
	failed: "rose",
	cancelled: "rose",
	interrupted: "yellow",
	running: "blue",
	pending: "neutral"
}, Ae = {
	running: "进行中",
	pausing: "正在暂停",
	paused: "已暂停",
	cancelling: "正在取消"
};
function X({ run: e }) {
	let n = e.control?.state;
	if (n && (n !== "running" || !A(e))) return /* @__PURE__ */ (0, J.jsx)(t, {
		color: n === "running" ? "blue" : "neutral",
		children: /* @__PURE__ */ (0, J.jsx)("span", {
			"data-copy-key": `tasks.control.state.${n}`,
			children: Ae[n]
		})
	});
	let r = e.status === "failed" && e.task_key === "library-processing" && e.result_summary?.outcome === "partial", i = r || e.status === "succeeded" && O(e);
	return /* @__PURE__ */ (0, J.jsx)(t, {
		color: i ? "yellow" : ke[e.status] ?? "neutral",
		children: r ? "部分项目需处理" : i ? "发现问题" : z(e.status)
	});
}
function je({ rows: e }) {
	return /* @__PURE__ */ (0, J.jsx)("ul", {
		className: "flex min-w-0 flex-col",
		children: e.map((e) => {
			let t = E(e);
			return /* @__PURE__ */ (0, J.jsxs)("li", {
				"data-status": e.status,
				"data-followup-key": e.followup_key,
				className: "flex min-w-0 flex-col gap-1 border-t border-separator-border px-5 py-2.5",
				children: [
					/* @__PURE__ */ (0, J.jsxs)("div", {
						className: "flex min-w-0 items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, J.jsxs)("div", {
							className: "flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
							children: [
								/* @__PURE__ */ (0, J.jsx)("span", {
									className: "min-w-0 break-words text-caption-1-regular text-text-primary",
									children: e.task_label
								}),
								/* @__PURE__ */ (0, J.jsx)(X, { run: e }),
								t ? /* @__PURE__ */ (0, J.jsx)("span", {
									className: "min-w-0 break-words text-caption-1-regular text-text-secondary",
									children: t
								}) : null
							]
						}), /* @__PURE__ */ (0, J.jsx)(xe, { run: e })]
					}),
					/* @__PURE__ */ (0, J.jsx)(Ee, { run: e }),
					Object.keys(e.result_summary || {}).length ? /* @__PURE__ */ (0, J.jsx)("div", {
						className: "w-full min-w-0",
						children: /* @__PURE__ */ (0, J.jsx)(n, {
							summary: "技术详情",
							contentClassName: "pb-2.5",
							children: /* @__PURE__ */ (0, J.jsx)(G, {
								code: JSON.stringify(e.result_summary, null, 2),
								language: "json",
								label: `${e.task_label}技术详情`
							})
						})
					}) : null
				]
			}, e.id);
		})
	});
}
function Z({ run: e, meta: t, children: r, footer: i, followups: a, followupTotal: o = 0, badge: s, resourceActive: c }) {
	let l = (e) => e.status === "running" ? 3 : e.status === "pending" ? 2 : +(e.status === "failed" || e.status === "interrupted"), u = a ? [...a].sort((e, t) => l(t) - l(e) || t.id - e.id).slice(0, De) : [], d = u.length, f = Math.max(a?.length || 0, o);
	return /* @__PURE__ */ (0, J.jsxs)("li", {
		id: `run-${e.id}`,
		"data-status": e.status,
		"data-task-key": e.task_key,
		"data-run-id": e.id,
		className: y({
			padding: "none",
			bordered: "line",
			className: e.status === "failed" ? "flex flex-col border-border-error-default" : "flex flex-col"
		}),
		children: [
			/* @__PURE__ */ (0, J.jsxs)("div", {
				className: "flex flex-col gap-2 px-5 py-4",
				children: [
					/* @__PURE__ */ (0, J.jsxs)("div", {
						className: "flex min-w-0 items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, J.jsxs)("div", {
							className: "flex min-w-0 flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, J.jsx)("strong", {
								className: "min-w-0 break-words text-title-3-medium text-text-primary",
								children: e.task_label
							}), s ?? /* @__PURE__ */ (0, J.jsx)(X, { run: e })]
						}), /* @__PURE__ */ (0, J.jsx)(xe, { run: e })]
					}),
					/* @__PURE__ */ (0, J.jsx)("p", {
						className: "text-caption-1-regular text-text-secondary",
						children: t
					}),
					/* @__PURE__ */ (0, J.jsx)(Ee, {
						run: e,
						active: c
					}),
					r
				]
			}),
			d ? /* @__PURE__ */ (0, J.jsx)("div", {
				className: "border-t border-separator-border px-5 py-2.5",
				children: /* @__PURE__ */ (0, J.jsxs)(n, {
					summary: `任务明细 · ${f.toLocaleString()} 项`,
					contentClassName: "pb-2.5",
					defaultOpen: u.some((e) => A(e)),
					children: [d < f ? /* @__PURE__ */ (0, J.jsxs)("p", {
						className: "text-caption-1-regular text-text-secondary",
						children: [
							"列出其中 ",
							d.toLocaleString(),
							" 项，正在处理的排在前面"
						]
					}) : null, /* @__PURE__ */ (0, J.jsx)(je, { rows: u })]
				})
			}) : null,
			Object.keys(e.result_summary || {}).length ? /* @__PURE__ */ (0, J.jsx)("div", {
				className: "border-t border-separator-border px-5 py-2.5",
				children: /* @__PURE__ */ (0, J.jsx)(n, {
					summary: "技术详情",
					contentClassName: "pb-2.5",
					children: /* @__PURE__ */ (0, J.jsx)(G, {
						code: JSON.stringify(e.result_summary, null, 2),
						language: "json",
						label: `${e.task_label}技术详情`
					})
				})
			}) : null,
			i ? /* @__PURE__ */ (0, J.jsx)("div", {
				className: "flex min-h-14 flex-col justify-center rounded-b-2xl border-t border-separator-border bg-card-footer px-5 py-3",
				children: /* @__PURE__ */ (0, J.jsx)(de, {
					text: i,
					className: "text-caption-1-regular text-text-secondary"
				})
			}) : null
		]
	});
}
function Me({ run: e, followups: t }) {
	let n = e.progress_total || 0, r = e.progress_current || 0, i = e.control?.state, a = i && i !== "running", o = a ? Ae[i] : e.progress_label || "正在进行", s = C(e.elapsed_seconds), l = [p[e.trigger] || e.trigger, s && `已跑 ${s}`].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, J.jsxs)(Z, {
		run: e,
		meta: l,
		followups: t,
		children: [n > 0 ? /* @__PURE__ */ (0, J.jsxs)("div", {
			className: "flex flex-col gap-1.5",
			children: [/* @__PURE__ */ (0, J.jsx)(d, {
				label: o,
				value: Math.min(r, n),
				max: n
			}), /* @__PURE__ */ (0, J.jsxs)("p", {
				className: "text-caption-1-regular text-text-secondary wrap-anywhere",
				children: [
					o,
					" · ",
					F(r, n),
					" 项"
				]
			})]
		}) : a ? /* @__PURE__ */ (0, J.jsx)("p", {
			"data-copy-key": `tasks.control.state.${i}`,
			className: "text-caption-1-regular text-text-secondary",
			children: o
		}) : /* @__PURE__ */ (0, J.jsx)(c, { label: o }), e.task_key === "library-processing" ? /* @__PURE__ */ (0, J.jsx)(m, { runId: e.id }) : null]
	});
}
function Ne({ run: e, followups: r, runs: i, latest: a, followupTotal: o, followupFailed: c = 0, followupCancelled: l = 0 }) {
	let u = !!(i && i.length > 1 && o), d = u ? [`共处理 ${o.toLocaleString()} 项`, c ? `其中 ${c.toLocaleString()} 项失败` : ""].filter(Boolean) : B(e.result_summary).filter((t) => t !== e.error), f = V(e), m = P(e, a), h = C(e.elapsed_seconds), g = i && i.length > 1 ? i[i.length - 1] : void 0, _ = (g ? [
		p[e.trigger] || e.trigger,
		`近 ${i.length} 轮`,
		`${M(g.finished_at)} – ${M(e.finished_at)}`
	] : [
		p[e.trigger] || e.trigger,
		M(e.finished_at),
		h && `用时 ${h}`
	]).filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, J.jsxs)(Z, {
		run: e,
		meta: _,
		footer: e.error,
		followups: r,
		followupTotal: o,
		badge: l && e.status === "succeeded" ? /* @__PURE__ */ (0, J.jsx)(t, {
			color: "rose",
			children: /* @__PURE__ */ (0, J.jsx)("span", {
				"data-copy-key": `tasks.followups.cancelled.${l === o ? "all" : "partial"}`,
				children: l === o ? "后续任务已取消" : "部分后续任务已取消"
			})
		}) : u && c ? /* @__PURE__ */ (0, J.jsx)(t, {
			color: "yellow",
			children: "发现问题"
		}) : void 0,
		children: [
			l ? /* @__PURE__ */ (0, J.jsxs)("p", {
				className: "text-caption-1-regular text-text-secondary",
				children: [
					"后续任务已取消 ",
					l.toLocaleString(),
					" 项"
				]
			}) : null,
			d.length === 1 ? /* @__PURE__ */ (0, J.jsx)("p", {
				className: "text-caption-1-regular text-text-secondary wrap-anywhere",
				children: d[0]
			}) : d.length ? /* @__PURE__ */ (0, J.jsx)("ul", {
				className: "flex list-disc flex-col gap-1 pl-5 text-caption-1-regular text-text-secondary wrap-anywhere",
				children: d.map((e, t) => /* @__PURE__ */ (0, J.jsx)("li", { children: e }, t))
			}) : null,
			f.length ? /* @__PURE__ */ (0, J.jsx)(n, {
				summary: `问题详情 · ${f.length} 项`,
				contentClassName: "pt-2",
				children: /* @__PURE__ */ (0, J.jsx)(ue, {
					label: "任务问题详情",
					children: /* @__PURE__ */ (0, J.jsx)("ul", {
						className: "flex min-w-0 flex-col gap-3",
						"data-task-issues": "",
						children: f.map((e, t) => /* @__PURE__ */ (0, J.jsxs)("li", {
							className: "flex min-w-0 flex-col gap-1 text-body-2-regular wrap-anywhere",
							children: [/* @__PURE__ */ (0, J.jsx)("p", {
								className: "text-body-regular text-text-primary",
								children: [
									e.label,
									e.provider,
									e.kind
								].filter(Boolean).join(" · ")
							}), /* @__PURE__ */ (0, J.jsx)(de, {
								text: e.error,
								className: "text-text-primary"
							})]
						}, `${e.source}-${t}`))
					})
				})
			}) : O(e) && ["follow-check", "feed-check"].includes(e.task_key) ? /* @__PURE__ */ (0, J.jsx)("p", {
				className: "text-body-2-regular text-text-secondary",
				children: "未取得本轮逐项详情，可到来源列表查看检查结果。"
			}) : null,
			m ? /* @__PURE__ */ (0, J.jsx)(s, {
				href: m.href,
				size: "small",
				trailingIcon: k,
				className: "self-start",
				children: m.label
			}) : null
		]
	});
}
function Pe({ runs: e, followups: n, counts: r }) {
	let i = e[0], a = e[e.length - 1], o = D(r, e), s = Math.max(o.total, n.length), c = o.total ? o.settled : n.filter((e) => !A(e)).length, l = o.total ? o.failed : n.filter((e) => e.status === "failed" || e.status === "interrupted").length, u = [
		p[i.trigger] || i.trigger,
		e.length > 1 ? `${e.length} 批` : "",
		`${M(a.started_at || a.finished_at)} 开始`
	].filter(Boolean).join(" · ");
	return /* @__PURE__ */ (0, J.jsx)(Z, {
		run: i,
		meta: u,
		followups: n,
		followupTotal: s,
		resourceActive: !0,
		badge: i.control ? /* @__PURE__ */ (0, J.jsx)(X, { run: i }) : /* @__PURE__ */ (0, J.jsx)(t, {
			color: "blue",
			children: "进行中"
		}),
		children: /* @__PURE__ */ (0, J.jsxs)("div", {
			className: "flex flex-col gap-1.5",
			children: [/* @__PURE__ */ (0, J.jsx)(d, {
				label: `${i.task_label}进度`,
				value: c,
				max: s
			}), /* @__PURE__ */ (0, J.jsxs)("p", {
				className: "text-caption-1-regular text-text-secondary",
				children: [
					"已处理 ",
					F(c, s),
					" 项",
					l ? ` · 其中 ${l.toLocaleString()} 项失败` : ""
				]
			})]
		})
	});
}
function Q({ title: e, children: t }) {
	let n = (0, q.useId)();
	return /* @__PURE__ */ (0, J.jsxs)("section", {
		"aria-labelledby": n,
		className: "flex min-w-0 flex-col gap-3",
		children: [/* @__PURE__ */ (0, J.jsx)("h3", {
			id: n,
			className: "text-title-2-medium text-text-primary",
			children: e
		}), t]
	});
}
function $({ live: e = !1, children: t }) {
	return /* @__PURE__ */ (0, J.jsx)("ul", {
		"aria-live": e ? "polite" : void 0,
		className: "flex min-w-0 flex-col gap-3",
		children: t
	});
}
function Fe() {
	let t = U({
		queryKey: f,
		queryFn: ({ signal: e }) => ne(e),
		refetchInterval: (e) => ce(e.state.data)
	}), n = t.data, a = n?.finished, [o, s] = (0, q.useState)([]), [c, u] = (0, q.useState)(!1), [d, p] = (0, q.useState)({}), [m, h] = (0, q.useState)(a);
	a !== m && (h(a), o.length && m && s(j(o, m)));
	let g = H({
		mutationFn: ({ oldest: e }) => te(e),
		onSuccess: (e, { shown: t }) => {
			s((n) => j(n, t, e.finished || [])), u(!!e.finished_has_more), p((t) => ({
				...t,
				...e.followup_counts
			}));
		}
	}), _ = t.error ? w(t.error) : "";
	if (!n) return /* @__PURE__ */ (0, J.jsx)(K, { children: /* @__PURE__ */ (0, J.jsx)(l, {
		tone: "error",
		children: _ || "读取任务中心失败"
	}) });
	let y = j(n.finished || [], o), b = n.working_parents || [], x = [
		...n.running || [],
		...n.skipped || [],
		...y,
		...b
	], S = ae(x), C = new Set(x.map((e) => e.id)), T = (e) => e.filter((e) => !(e.followup_key && e.parent_run_id != null && C.has(e.parent_run_id))), E = T(y), k = E[E.length - 1], M = !!k && (o.length ? c : !!n.finished_has_more), N = () => {
		!g.isPending && k && g.mutate({
			oldest: k,
			shown: y
		});
	}, P = {
		...d,
		...n.followup_counts
	}, F = (e) => e.flatMap((e) => S.get(e.id) || []), I = [...E, ...T(b)].filter((e) => D(P, [e]).active > 0 || S.get(e.id)?.some(A)).sort((e, t) => t.id - e.id), L = T(n.running || []), R = T(n.skipped || []), z = E.filter((e) => !I.includes(e) && !R.some((t) => t.id === e.id)), B = (e) => (S.get(e.id) || []).every((e) => e.status === "succeeded" && !O(e)) && D(P, [e]).failed === 0, V = ie(z, (e) => oe(e) && (B(e) || Oe.has(e.task_key))), W = [...re(I.filter((e) => !e.control)), ...I.filter((e) => e.control).map((e) => ({
		run: e,
		runs: [e]
	}))].sort((e, t) => t.run.id - e.run.id), G = se(x), ue = !L.length && !I.length && !R.length && !z.length;
	return /* @__PURE__ */ (0, J.jsxs)(K, { children: [
		_ ? /* @__PURE__ */ (0, J.jsx)(l, {
			tone: "error",
			children: _
		}) : null,
		/* @__PURE__ */ (0, J.jsx)(be, {}),
		n.available === !1 ? /* @__PURE__ */ (0, J.jsx)(l, {
			tone: "warning",
			children: n.message || "数据库尚未准备好任务记录表"
		}) : null,
		/* @__PURE__ */ (0, J.jsx)(he, {}),
		ue ? /* @__PURE__ */ (0, J.jsx)(i, {
			icon: le,
			title: "还没有任务记录",
			children: "扫描、追更检查、批量操作和命令行批处理跑起来之后，这里会显示它们的进度与结果。"
		}) : /* @__PURE__ */ (0, J.jsxs)(J.Fragment, { children: [
			/* @__PURE__ */ (0, J.jsx)(Q, {
				title: "正在进行",
				children: L.length || I.length ? /* @__PURE__ */ (0, J.jsxs)($, {
					live: !0,
					children: [L.map((e) => /* @__PURE__ */ (0, J.jsx)(Me, {
						run: e,
						followups: S.get(e.id)
					}, e.id)), W.map(({ run: e, runs: t }) => /* @__PURE__ */ (0, J.jsx)(Pe, {
						runs: t,
						followups: F(t),
						counts: P
					}, e.id))]
				}) : /* @__PURE__ */ (0, J.jsx)(l, {
					tone: "neutral",
					children: "没有任务在跑。"
				})
			}),
			R.length ? /* @__PURE__ */ (0, J.jsx)(Q, {
				title: "本次未执行",
				children: /* @__PURE__ */ (0, J.jsx)($, { children: R.map((e) => /* @__PURE__ */ (0, J.jsx)(Ne, {
					run: e,
					latest: G.has(e.id),
					followups: S.get(e.id)
				}, e.id)) })
			}) : null,
			z.length || M ? /* @__PURE__ */ (0, J.jsxs)(Q, {
				title: "最近完成",
				children: [
					z.length ? /* @__PURE__ */ (0, J.jsx)($, { children: V.map(({ run: e, runs: t }) => {
						let n = D(P, t);
						return /* @__PURE__ */ (0, J.jsx)(Ne, {
							run: e,
							runs: t,
							latest: G.has(e.id),
							followups: F(t),
							followupTotal: n.total,
							followupFailed: n.failed,
							followupCancelled: n.cancelled
						}, e.id);
					}) }) : null,
					g.error ? /* @__PURE__ */ (0, J.jsx)(l, {
						tone: "error",
						children: w(g.error)
					}) : null,
					M ? /* @__PURE__ */ (0, J.jsx)(e, {
						variant: "secondary",
						size: "small",
						leadingIcon: ee,
						className: "self-start",
						...v(g.isPending),
						onClick: N,
						children: "加载更早"
					}) : null
				]
			}) : null
		] }),
		/* @__PURE__ */ (0, J.jsx)(r, {})
	] });
}
export { Fe as ActivityPage };

//# debugId=2f2e8803-d6c2-4f13-9ed9-34e632641b06