(function() {
	try {
		var e = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, t = new e.Error().stack;
		t && (e._sentryDebugIds = e._sentryDebugIds || {}, e._sentryDebugIds[t] = "e9a3e080-03f2-4b8e-a3ac-be6d0bf66699", e._sentryDebugIdIdentifier = "sentry-dbid-e9a3e080-03f2-4b8e-a3ac-be6d0bf66699");
	} catch {}
})();
import { $fe21c36db05242bb$export$d7b12c4107be0d61 as e, AMANE_BRIDGE_CHECK_URL as t, AMANE_BRIDGE_KEY as n, AMANE_BRIDGE_REBUILD_URL as r, Button as i, COVER_JOB_KEY as a, CUSTOM_SOURCES_KEY as o, CUSTOM_SOURCES_URL as s, Checkbox as c, Disclosure as l, ErrorText as u, ExternalLink as d, Fact as f, FactList as p, FieldLabel as m, Footer as h, Help as g, Input as _, LinkButton as v, LoadingDots as y, Note as b, Rows as ee, SCRAPING_CHECK_URL as te, SCRAPING_COVER_URL as x, SCRAPING_KEY as S, SCRAPING_SETTINGS_URL as C, SEGMENT as ne, SEGMENTED_TRACK as re, Section as w, SegmentedRadioGroup as ie, Select$1 as T, SelectField as E, SelectItem as D, SettingsRow as ae, Stack as O, StatusLabel as k, __toESM as A, apiSend as j, busyProps as M, checkText as oe, confirmModal as N, errorMessage as P, esc as F, fetchAmaneBridge as I, fetchCoverJob as L, fetchCustomSources as R, fetchSources as z, i2 as se, queryClient as B, require_jsx_runtime as V, require_react as H, spinnerHtml as U, useAction as W, useBackgroundJob as G, useMutation as K, useQuery as q, wireDragReorder as ce } from "./peach-app.js";
import { CodeBlock as le } from "./peach-app.code-block-CyDva4Ms.js";
import { Page as J } from "./peach-app.page-QAncjzM1.js";
import { SiteMark as Y } from "./peach-app.site-mark-D_VlIyJz.js";
import { ConnectionStatus as ue } from "./peach-app.connection-status-DI6kgn3i.js";
// src/react/scraping/custom-sources.tsx
var X = /* @__PURE__ */ A(H(), 1), Z = V(), de = [
	["code", "番号"],
	["title", "标题"],
	["studio", "厂牌"],
	["series", "系列"],
	["release_date", "发行日期"],
	["performers", "演员（文本数组）"],
	["tags", "标签（文本数组）"]
], fe = [
	["censored", "有码"],
	["amateur", "素人"],
	["uncensored", "无码"],
	["fc2", "FC2"],
	["kmib", "韩国 MIB"],
	["other", "其他"],
	["unsure", "待核番号"],
	["unknown", "未知"]
], pe = () => ({
	name: "",
	endpoint: "",
	enabled: !1,
	fields: {
		code: "id",
		title: "title"
	},
	content_types: ["censored"]
});
function me({ receipt: e }) {
	let [t, n] = (0, X.useState)(null), r = q({
		queryKey: o,
		queryFn: ({ signal: e }) => R(e)
	}), a = W(), c = (e) => B.setQueryData(o, e), l = !!(r.isPending || r.error || r.data?.items.length || a.error), d = /* @__PURE__ */ (0, Z.jsx)(i, {
		variant: "secondary",
		onClick: () => n(pe()),
		children: "添加来源"
	});
	return /* @__PURE__ */ (0, Z.jsxs)(w, {
		title: "自定义元数据来源",
		children: [
			l ? /* @__PURE__ */ (0, Z.jsxs)(O, { children: [
				r.isPending ? /* @__PURE__ */ (0, Z.jsx)("div", {
					"aria-busy": "true",
					"data-skeleton": "",
					"aria-label": "读取自定义来源"
				}) : null,
				r.error ? /* @__PURE__ */ (0, Z.jsx)(u, { children: P(r.error) }) : null,
				r.data?.items.map((t) => /* @__PURE__ */ (0, Z.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, Z.jsx)("span", {
							className: "min-w-0 flex-1",
							children: t.name
						}),
						/* @__PURE__ */ (0, Z.jsx)(k, {
							tone: t.enabled ? "success" : "neutral",
							children: t.enabled ? "已启用" : "已停用"
						}),
						/* @__PURE__ */ (0, Z.jsx)(i, {
							variant: "secondary",
							onClick: () => n(t),
							children: "编辑"
						}),
						/* @__PURE__ */ (0, Z.jsx)(i, {
							variant: "secondary",
							...M(a.busy === t.id),
							onClick: () => void a.run(t.id, (e) => j(s, {
								...t,
								enabled: !t.enabled
							}, "POST", e), (n) => {
								c(n), e(t.enabled ? "已停用来源" : "已启用来源");
							}),
							children: t.enabled ? "停用" : "启用"
						}),
						/* @__PURE__ */ (0, Z.jsx)(i, {
							variant: "danger",
							onClick: () => N({
								title: "删除自定义来源",
								body: `删除「${F(t.name)}」后，采集将不再查询这个来源。`,
								confirmLabel: "删除来源",
								danger: !0,
								onConfirm: async () => {
									c(await j(s, {
										action: "delete",
										id: t.id
									})), n(null), e("已删除来源");
								}
							}),
							children: "删除"
						})
					]
				}, t.id)),
				a.error ? /* @__PURE__ */ (0, Z.jsx)(u, { children: a.error }) : null
			] }) : null,
			t ? null : l ? /* @__PURE__ */ (0, Z.jsx)(h, { children: d }) : /* @__PURE__ */ (0, Z.jsx)(O, { children: /* @__PURE__ */ (0, Z.jsx)("div", {
				className: "flex justify-end",
				children: d
			}) }),
			t ? /* @__PURE__ */ (0, Z.jsx)(he, {
				initial: t,
				cancel: () => n(null),
				saved: (t) => {
					c(t), n(null), e("已保存来源");
				}
			}, t.id || "new") : null
		]
	});
}
function he({ initial: e, cancel: t, saved: n }) {
	let [r, a] = (0, X.useState)(e), [o, l] = (0, X.useState)(""), [d, f] = (0, X.useState)(""), p = (0, X.useRef)(0), v = W(), y = (e) => {
		p.current++, a((t) => ({
			...t,
			...e
		})), f("");
	};
	return /* @__PURE__ */ (0, Z.jsxs)("form", {
		"aria-label": "元数据来源配置",
		"aria-busy": v.busy === "preview",
		onSubmit: (e) => {
			e.preventDefault(), v.run("save", (e) => j(s, r, "POST", e), n);
		},
		children: [/* @__PURE__ */ (0, Z.jsxs)(O, { children: [
			/* @__PURE__ */ (0, Z.jsx)(_, {
				label: "来源名称",
				value: r.name,
				maxLength: 80,
				onChange: (e) => y({ name: e })
			}),
			/* @__PURE__ */ (0, Z.jsx)(_, {
				label: "JSON 接口地址",
				value: r.endpoint,
				maxLength: 2048,
				placeholder: "https://example.com/api/movies/{code}",
				onChange: (e) => y({ endpoint: e })
			}),
			/* @__PURE__ */ (0, Z.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, Z.jsx)(m, { children: "来源连接方式" }), /* @__PURE__ */ (0, Z.jsx)(E, {
					id: "custom-source-network",
					label: "来源连接方式",
					epoch: 0,
					value: r.network || "direct",
					options: [["direct", "直连"], ["peach_proxy", "Peach 代理"]],
					onPick: (e) => y({ network: e })
				})]
			}),
			/* @__PURE__ */ (0, Z.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, Z.jsx)(m, { children: "接口番号格式" }), /* @__PURE__ */ (0, Z.jsx)(E, {
					id: "custom-source-code-format",
					label: "接口番号格式",
					epoch: 0,
					value: r.code_format || "original",
					options: [
						["original", "原样"],
						["lowercase", "小写"],
						["compact", "去掉连字符"],
						["underscore", "连字符转下划线"]
					],
					onPick: (e) => y({ code_format: e })
				})]
			}),
			/* @__PURE__ */ (0, Z.jsx)(g, { children: "填写公开 JSON 接口和响应字段路径，例如 data.title。番号字段用于核对作品身份。" }),
			de.map(([e, t]) => /* @__PURE__ */ (0, Z.jsx)(_, {
				label: `${t}字段路径`,
				value: r.fields[e] || "",
				onChange: (t) => {
					let n = { ...r.fields };
					t ? n[e] = t : delete n[e], y({ fields: n });
				}
			}, e)),
			/* @__PURE__ */ (0, Z.jsx)("div", {
				className: "flex flex-wrap gap-3",
				role: "group",
				"aria-label": "适用内容类型",
				children: fe.map(([e, t]) => /* @__PURE__ */ (0, Z.jsx)(c, {
					isSelected: r.content_types.includes(e),
					onChange: (t) => y({ content_types: t ? [...r.content_types, e] : r.content_types.filter((t) => t !== e) }),
					children: t
				}, e))
			}),
			/* @__PURE__ */ (0, Z.jsx)(c, {
				isSelected: r.enabled,
				onChange: (e) => y({ enabled: e }),
				children: "启用来源"
			}),
			/* @__PURE__ */ (0, Z.jsx)(_, {
				label: "试查番号（回车查询）",
				value: o,
				onChange: (e) => {
					p.current++, l(e), f("");
				},
				onKeyDown: (e) => {
					if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
					e.preventDefault();
					let t = p.current;
					v.run("preview", (e) => j(s, {
						...r,
						code: o,
						action: "preview"
					}, "POST", e), (e) => {
						t === p.current && f(JSON.stringify(e.record, null, 2));
					}, (e) => {
						t === p.current && v.setError(P(e));
					});
				}
			}),
			v.busy === "preview" ? /* @__PURE__ */ (0, Z.jsxs)(g, {
				role: "status",
				children: [/* @__PURE__ */ (0, Z.jsx)("span", { dangerouslySetInnerHTML: { __html: U("正在试查来源") } }), "正在试查来源"]
			}) : null,
			d ? /* @__PURE__ */ (0, Z.jsx)(le, {
				code: d,
				language: "json",
				label: "元数据接口返回"
			}) : null,
			v.error ? /* @__PURE__ */ (0, Z.jsx)(u, { children: v.error }) : null
		] }), /* @__PURE__ */ (0, Z.jsxs)(h, { children: [/* @__PURE__ */ (0, Z.jsx)(i, {
			variant: "secondary",
			type: "button",
			onClick: t,
			children: "取消"
		}), /* @__PURE__ */ (0, Z.jsx)(i, {
			type: "submit",
			...M(v.busy === "save"),
			children: "保存来源"
		})] })]
	});
}
// src/react/scraping/source-policy.tsx
function ge({ initial: e, toast: t }) {
	let [n, r] = (0, X.useState)({
		preferred_sources: e.preferred_sources,
		disabled_sources: e.disabled_sources,
		concurrency: e.concurrency ?? null
	}), [a, o] = (0, X.useState)(String(e.concurrency ?? e.default_concurrency)), s = n.concurrency === null ? null : Number(a), u = s !== null && (!/^[1-9]\d*$/.test(a) || !Number.isSafeInteger(s)), d = K({
		mutationFn: () => j(C, { collection_policy: {
			...n,
			concurrency: s
		} }),
		onSuccess: (n) => {
			r(n.collection_policy), o(String(n.collection_policy.concurrency ?? e.default_concurrency)), B.setQueryData(S, (t) => t && {
				...t,
				collection_policy: {
					...e,
					...n.collection_policy
				}
			}), t("采集设置已保存");
		}
	}), f = (0, X.useRef)(!1);
	f.current = d.isPending;
	let p = (t) => e.sources.find((e) => e.source === t)?.label || t, m = (e, t) => r((n) => {
		let r = n.preferred_sources.filter((t) => t !== e);
		return r.splice(t, 0, e), {
			...n,
			preferred_sources: r
		};
	}), v = (0, X.useCallback)((e) => {
		e && ce(e, {
			selector: "[data-source-order]",
			attribute: "data-source-order",
			onMove: (e, t, n) => r((r) => {
				if (f.current) return r;
				let i = r.preferred_sources.filter((t) => t !== e);
				return i.splice(i.indexOf(t) + Number(n), 0, e), {
					...r,
					preferred_sources: i
				};
			})
		});
	}, [n.preferred_sources.join(",")]);
	return /* @__PURE__ */ (0, Z.jsxs)(w, {
		title: "馆藏采集来源",
		children: [
			/* @__PURE__ */ (0, Z.jsx)(g, { children: "优先来源按顺序查询，资料不足或封面未取得时继续使用后备来源。停用只影响馆藏采集，登录凭证和已有资料保留。" }),
			/* @__PURE__ */ (0, Z.jsxs)(O, { children: [
				/* @__PURE__ */ (0, Z.jsxs)("div", {
					className: "flex flex-wrap items-end gap-3",
					children: [/* @__PURE__ */ (0, Z.jsxs)(T, {
						"aria-label": "采集并发数",
						selectedKey: n.concurrency === null ? "auto" : "custom",
						isDisabled: d.isPending,
						onSelectionChange: (t) => r((n) => ({
							...n,
							concurrency: t === "auto" ? null : e.default_concurrency
						})),
						children: [/* @__PURE__ */ (0, Z.jsxs)(D, {
							id: "auto",
							children: [
								"自动（CPU 逻辑核心数：",
								e.default_concurrency,
								"）"
							]
						}), /* @__PURE__ */ (0, Z.jsx)(D, {
							id: "custom",
							children: "自定义"
						})]
					}), n.concurrency === null ? null : /* @__PURE__ */ (0, Z.jsx)(_, {
						label: "同时采集作品数",
						type: "number",
						inputMode: "numeric",
						className: "w-40",
						autoComplete: "off",
						value: a,
						onChange: o,
						isDisabled: d.isPending,
						isInvalid: u,
						hint: u ? "请输入大于 0 的整数。" : void 0
					})]
				}),
				/* @__PURE__ */ (0, Z.jsx)(g, { children: "并发数在下次启动采集任务时生效；来源顺序和启用状态从下一部影片开始使用。处理强度控制节奏，来源限流和任务总预算仍然有效。" }),
				/* @__PURE__ */ (0, Z.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, Z.jsx)(i, {
						variant: "secondary",
						size: "small",
						disabled: d.isPending,
						onClick: () => r((e) => ({
							...e,
							preferred_sources: ["javbus", "javdb"],
							disabled_sources: e.disabled_sources.filter((e) => !["javbus", "javdb"].includes(e))
						})),
						children: "优先 JavBus 和 JavDB"
					}), /* @__PURE__ */ (0, Z.jsx)(i, {
						variant: "secondary",
						size: "small",
						disabled: d.isPending,
						onClick: () => r((e) => ({
							...e,
							preferred_sources: [],
							disabled_sources: []
						})),
						children: "恢复内置顺序"
					})]
				}),
				n.preferred_sources.length ? /* @__PURE__ */ (0, Z.jsx)("ol", {
					ref: v,
					"aria-label": "优先来源顺序",
					className: "flex flex-col gap-3",
					children: n.preferred_sources.map((e, t) => /* @__PURE__ */ (0, Z.jsxs)("li", {
						"data-source-order": e,
						className: "flex cursor-grab flex-wrap items-center justify-between gap-2 [&.drop-before]:border-t-2 [&.drop-after]:border-b-2",
						children: [/* @__PURE__ */ (0, Z.jsxs)("span", {
							className: "text-body-2-regular",
							children: [
								t + 1,
								". ",
								p(e)
							]
						}), /* @__PURE__ */ (0, Z.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, Z.jsx)(T, {
								"aria-label": `${p(e)} 优先顺序`,
								selectedKey: String(t),
								size: "sm",
								onSelectionChange: (t) => m(e, Number(t)),
								isDisabled: d.isPending,
								children: n.preferred_sources.map((e, t) => /* @__PURE__ */ (0, Z.jsxs)(D, {
									id: String(t),
									children: [
										"第 ",
										t + 1,
										" 位"
									]
								}, t))
							}), /* @__PURE__ */ (0, Z.jsx)(i, {
								variant: "secondary",
								size: "small",
								disabled: d.isPending,
								onClick: () => r((t) => ({
									...t,
									preferred_sources: t.preferred_sources.filter((t) => t !== e)
								})),
								children: "设为后备"
							})]
						})]
					}, e))
				}, n.preferred_sources.join(",")) : /* @__PURE__ */ (0, Z.jsx)(g, { children: "当前使用内置的内容类型来源顺序。" }),
				/* @__PURE__ */ (0, Z.jsx)(l, {
					summary: "后备来源与启用状态",
					children: /* @__PURE__ */ (0, Z.jsx)("ul", {
						className: "flex flex-col gap-3",
						children: e.sources.filter((e) => !n.preferred_sources.includes(e.source)).map((e) => /* @__PURE__ */ (0, Z.jsxs)("li", {
							className: "flex flex-wrap items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, Z.jsx)(c, {
								isSelected: !n.disabled_sources.includes(e.source),
								isDisabled: d.isPending,
								onChange: (t) => r((n) => ({
									...n,
									disabled_sources: t ? n.disabled_sources.filter((t) => t !== e.source) : [...n.disabled_sources, e.source]
								})),
								children: e.label
							}), e.can_prefer ? /* @__PURE__ */ (0, Z.jsx)(i, {
								variant: "secondary",
								size: "small",
								disabled: d.isPending || n.disabled_sources.includes(e.source),
								onClick: () => r((t) => ({
									...t,
									preferred_sources: [...t.preferred_sources, e.source]
								})),
								children: "设为优先"
							}) : null]
						}, e.source))
					})
				}),
				/* @__PURE__ */ (0, Z.jsx)(g, { children: "查询仍按作品类型选择适用来源。来源偏好不改变资料复核和封面身份、尺寸检查。" }),
				d.error ? /* @__PURE__ */ (0, Z.jsx)(b, {
					tone: "error",
					children: P(d.error)
				}) : null
			] }),
			/* @__PURE__ */ (0, Z.jsx)(h, { children: /* @__PURE__ */ (0, Z.jsx)(i, {
				...M(d.isPending),
				disabled: u || d.isPending,
				onClick: () => d.mutate(),
				children: "保存采集来源"
			}) })
		]
	});
}
// src/react/scraping/scraping-page.tsx
var Q = [["peach", "Peach 代理"], ["direct", "直接连接"]];
function $(e) {
	return Q.some(([t]) => t === e) || !e ? [...Q] : [...Q, [e, e]];
}
function _e(e) {
	try {
		return new URL(e).host || e;
	} catch {
		return e;
	}
}
var ve = [["paste", "粘贴 Cookie"], ["file", "导入文件"]];
function ye() {
	return /* @__PURE__ */ (0, Z.jsx)(Y, { source: "github" });
}
function be({ source: t, toast: n }) {
	let [r, a] = (0, X.useState)(t.network), [o, s] = (0, X.useState)(""), [c, l] = (0, X.useState)(""), [f, p] = (0, X.useState)(ve[0][0]), [g, y] = (0, X.useState)(""), [x, E] = (0, X.useState)(""), A = (0, X.useRef)(null);
	function N() {
		s(""), l(""), y(""), E(""), A.current && (A.current.value = "");
	}
	let F = K({
		mutationFn: (e) => j(C, {
			source: t.source,
			network: r,
			cookie: o,
			cookies_text: c,
			revoke: e
		}),
		onSuccess: (e, t) => {
			B.setQueryData(S, (t) => t && {
				...t,
				sources: t.sources.map((t) => t.source === e.saved.source ? e.saved : t)
			}), N(), n(t ? "Cookie 已撤销" : "来源设置已保存");
		}
	}), I = K({ mutationFn: () => j(te, { source: t.source }) }), L = F.isPending || I.isPending, R = (e) => {
		e.preventDefault(), !L && (I.reset(), F.mutate(!1));
	}, z = () => {
		L || (I.reset(), F.mutate(!0));
	}, V = () => {
		L || (F.reset(), I.mutate());
	};
	async function H(e) {
		let t = e.currentTarget, n = t.files?.[0];
		if (l(""), E(""), !n) y("");
		else if (n.size > 262144) t.value = "", y(""), E("Cookie 文本超过 256 KiB");
		else try {
			let e = await n.text();
			l(e), y(n.name);
		} catch {
			E("Cookie 文件未读取，请重新选择");
		}
	}
	let U = x || (F.error ? P(F.error) : "") || (I.error ? P(I.error) : ""), W = I.data?.results ?? [], G = r === "peach" || t.accepts_cookie || t.browser || !!U || W.length > 0;
	return /* @__PURE__ */ (0, Z.jsxs)(w, {
		title: t.label,
		onSubmit: R,
		aside: /* @__PURE__ */ (0, Z.jsxs)("span", {
			className: "flex min-w-0 items-center gap-1",
			children: [/* @__PURE__ */ (0, Z.jsx)(Y, { source: t.source }), t.login ? /* @__PURE__ */ (0, Z.jsx)(d, {
				href: t.login,
				children: _e(t.login)
			}) : null]
		}),
		children: [
			/* @__PURE__ */ (0, Z.jsx)(ee, { children: /* @__PURE__ */ (0, Z.jsx)(ae, {
				label: "连接方式",
				children: /* @__PURE__ */ (0, Z.jsx)(T, {
					"aria-label": "连接方式",
					className: "w-44 min-w-0",
					selectedKey: r,
					onSelectionChange: (e) => {
						e !== null && a(String(e));
					},
					children: $(r).map(([e, t]) => /* @__PURE__ */ (0, Z.jsx)(D, {
						id: e,
						children: t
					}, e))
				})
			}) }),
			t.cooldown_until && t.cooldown_until > Date.now() / 1e3 ? /* @__PURE__ */ (0, Z.jsx)(b, {
				tone: "warning",
				children: /* @__PURE__ */ (0, Z.jsxs)("span", {
					className: "inline-flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, Z.jsx)(k, {
						tone: "warning",
						children: "冷却中"
					}), /* @__PURE__ */ (0, Z.jsxs)("span", { children: [
						"可在 ",
						(/* @__PURE__ */ new Date(t.cooldown_until * 1e3)).toLocaleString("zh-CN"),
						" 后重试。"
					] })]
				})
			}) : null,
			G ? /* @__PURE__ */ (0, Z.jsxs)(O, {
				divided: !0,
				children: [
					r === "peach" ? /* @__PURE__ */ (0, Z.jsx)("span", {
						className: "self-start",
						children: /* @__PURE__ */ (0, Z.jsx)(v, {
							href: "/settings/library#peachProxy",
							size: "small",
							trailingIcon: se,
							children: "配置 Peach 代理"
						})
					}) : null,
					t.browser ? /* @__PURE__ */ (0, Z.jsx)("p", {
						className: "text-body-2-regular text-text-secondary",
						children: "人机验证由本机浏览器自动完成；需要点击时窗口会弹出。这台机器上不需要 Cookie。"
					}) : null,
					t.accepts_cookie && !t.browser ? /* @__PURE__ */ (0, Z.jsxs)(Z.Fragment, { children: [
						/* @__PURE__ */ (0, Z.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [/* @__PURE__ */ (0, Z.jsx)("span", {
								className: "self-start",
								children: /* @__PURE__ */ (0, Z.jsx)(k, {
									tone: t.cookie_saved ? "success" : "neutral",
									children: t.cookie_saved ? "Cookie 已保存" : "Cookie 未配置"
								})
							}), /* @__PURE__ */ (0, Z.jsx)("p", {
								className: "text-body-2-regular text-text-secondary",
								children: t.cookie_saved ? "登录有效性待验证。" : "需要登录时，任选一种方式提供 Cookie。"
							})]
						}),
						/* @__PURE__ */ (0, Z.jsx)(ie, {
							"aria-label": "提供 Cookie 的方式（二选一）",
							value: f,
							onChange: (e) => {
								p(e), N();
							},
							className: re,
							children: ve.map(([t, n]) => /* @__PURE__ */ (0, Z.jsx)(e, {
								value: t,
								className: ne,
								children: n
							}, t))
						}),
						f === "paste" ? /* @__PURE__ */ (0, Z.jsx)(_, {
							type: "password",
							label: "Cookie",
							autoComplete: "off",
							value: o,
							onChange: s
						}) : /* @__PURE__ */ (0, Z.jsxs)("div", {
							className: "flex flex-col gap-2",
							children: [
								/* @__PURE__ */ (0, Z.jsx)(m, { children: "Netscape Cookie 文件（.txt）" }),
								/* @__PURE__ */ (0, Z.jsxs)("div", {
									className: "flex flex-wrap items-center gap-3",
									children: [/* @__PURE__ */ (0, Z.jsx)(i, {
										variant: "secondary",
										onClick: () => A.current?.click(),
										children: "选择文件"
									}), /* @__PURE__ */ (0, Z.jsx)("span", {
										className: "min-w-0 text-body-2-regular break-all text-text-secondary",
										children: g || "未选择文件"
									})]
								}),
								/* @__PURE__ */ (0, Z.jsx)("input", {
									ref: A,
									type: "file",
									accept: ".txt",
									tabIndex: -1,
									"aria-hidden": !0,
									className: "hidden",
									onChange: (e) => {
										H(e);
									}
								})
							]
						})
					] }) : null,
					U ? /* @__PURE__ */ (0, Z.jsx)(u, { children: U }) : null,
					W.map((e) => /* @__PURE__ */ (0, Z.jsx)(b, {
						tone: e.ok ? "success" : "error",
						children: /* @__PURE__ */ (0, Z.jsxs)("span", {
							className: "flex flex-col items-start gap-1",
							children: [/* @__PURE__ */ (0, Z.jsx)(ue, {
								tone: e.ok ? "success" : "error",
								children: e.ok ? "可访问" : "连接失败"
							}), /* @__PURE__ */ (0, Z.jsx)("span", { children: oe(e, t.label) })]
						})
					}, e.label))
				]
			}) : null,
			/* @__PURE__ */ (0, Z.jsxs)(h, { children: [
				t.accepts_cookie && t.cookie_saved ? /* @__PURE__ */ (0, Z.jsx)(i, {
					variant: "secondary",
					onClick: z,
					...M(L),
					children: "撤销 Cookie"
				}) : null,
				/* @__PURE__ */ (0, Z.jsx)(i, {
					variant: "secondary",
					onClick: V,
					...M(L),
					children: "检查连接"
				}),
				/* @__PURE__ */ (0, Z.jsx)(i, {
					type: "submit",
					...M(L),
					children: "保存"
				})
			] })
		]
	});
}
function xe({ toast: e }) {
	let [t, n] = (0, X.useState)(""), { running: r, outcome: o, start: s } = G({
		queryKey: a,
		queryFn: ({ signal: e }) => L(e),
		start: () => j(x, { code: t }),
		onFinish: (t) => {
			t.status === "complete" && e(t.result || "封面采集完成");
		}
	}), c = (e) => {
		e.preventDefault(), !(r || s.isPending || !t.trim()) && s.mutate();
	}, l = s.error ? P(s.error) : o?.status === "failed" ? o.error || "采集未取得" : "";
	return /* @__PURE__ */ (0, Z.jsx)(w, {
		title: "高清封面",
		onSubmit: c,
		children: /* @__PURE__ */ (0, Z.jsxs)(O, { children: [
			/* @__PURE__ */ (0, Z.jsxs)("div", {
				className: "flex flex-wrap items-end gap-2",
				children: [/* @__PURE__ */ (0, Z.jsx)("div", {
					className: "min-w-0 flex-1",
					children: /* @__PURE__ */ (0, Z.jsx)(_, {
						"aria-label": "馆藏番号",
						isRequired: !0,
						isDisabled: r,
						value: t,
						onChange: n,
						placeholder: "输入馆藏番号，如 ABW-232"
					})
				}), /* @__PURE__ */ (0, Z.jsx)(i, {
					type: "submit",
					disabled: !t.trim(),
					...M(r || s.isPending),
					children: "抓取封面"
				})]
			}),
			r ? /* @__PURE__ */ (0, Z.jsx)(y, { label: "正在抓取封面" }) : null,
			l ? /* @__PURE__ */ (0, Z.jsx)(b, {
				tone: "error",
				children: l
			}) : null,
			o?.status === "complete" ? /* @__PURE__ */ (0, Z.jsx)(b, {
				tone: "success",
				children: o.result || "封面采集完成"
			}) : null
		] })
	});
}
function Se({ toast: e }) {
	let { query: a, running: o, outcome: s, start: c } = G({
		queryKey: n,
		queryFn: ({ signal: e }) => I(e),
		start: () => j(r, {}),
		jobOf: (e) => e.job,
		withJob: (e, t) => e && {
			...e,
			job: t
		},
		onFinish: (t) => {
			t.status === "complete" && e(t.result || "amane 桥已重建");
		}
	}), u = K({ mutationFn: () => j(t, {}) }), m = a.data;
	if (!m) return a.error ? /* @__PURE__ */ (0, Z.jsx)(w, {
		id: "amane",
		title: "amane",
		children: /* @__PURE__ */ (0, Z.jsx)(O, { children: /* @__PURE__ */ (0, Z.jsx)(b, {
			tone: "error",
			children: P(a.error)
		}) })
	}) : null;
	let _ = o || c.isPending || u.isPending, v = c.error ? P(c.error) : u.error ? P(u.error) : s?.status === "failed" ? s.error || "重建未完成" : "";
	return /* @__PURE__ */ (0, Z.jsxs)(w, {
		id: "amane",
		title: "amane",
		aside: /* @__PURE__ */ (0, Z.jsx)(d, {
			href: m.repository,
			leadingIcon: ye,
			children: m.repository
		}),
		children: [
			/* @__PURE__ */ (0, Z.jsxs)(p, { children: [
				/* @__PURE__ */ (0, Z.jsx)(f, {
					term: "已安装版本",
					children: m.installed_version || "未安装"
				}),
				/* @__PURE__ */ (0, Z.jsx)(f, {
					term: "上游最新版本",
					children: u.data?.latest ?? "尚未检查"
				}),
				/* @__PURE__ */ (0, Z.jsx)(f, {
					term: "运行环境",
					children: m.installed ? "已安装" : "未安装"
				}),
				/* @__PURE__ */ (0, Z.jsxs)(f, {
					term: "内置站点",
					children: [m.sites.length.toLocaleString(), " 个"]
				})
			] }),
			/* @__PURE__ */ (0, Z.jsxs)(O, {
				divided: !0,
				children: [
					m.sites.length ? /* @__PURE__ */ (0, Z.jsx)(l, {
						summary: "查看内置站点",
						children: /* @__PURE__ */ (0, Z.jsx)("p", {
							className: "text-body-2-regular text-text-secondary",
							children: m.sites.map((e) => e.label).join("、")
						})
					}) : null,
					m.problem ? /* @__PURE__ */ (0, Z.jsx)(b, {
						tone: "error",
						children: m.problem
					}) : /* @__PURE__ */ (0, Z.jsxs)(g, { children: [
						"amane（",
						m.license,
						"）提供这些内置站点的解析能力。首次需要时，Peach 会自动准备锁定的 ",
						m.version,
						" 版本；安装包内已有可用环境时直接使用。 手动安装也使用此版本，不随上游自动升级。"
					] }),
					o ? /* @__PURE__ */ (0, Z.jsx)(y, { label: "正在重建运行环境" }) : null,
					v ? /* @__PURE__ */ (0, Z.jsx)(b, {
						tone: "error",
						children: v
					}) : null,
					s?.status === "complete" ? /* @__PURE__ */ (0, Z.jsx)(b, {
						tone: "success",
						children: s.result || "amane 桥已重建"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, Z.jsxs)(h, { children: [/* @__PURE__ */ (0, Z.jsx)(i, {
				variant: "secondary",
				onClick: () => {
					_ || u.mutate();
				},
				...M(u.isPending),
				children: "检查上游版本"
			}), /* @__PURE__ */ (0, Z.jsx)(i, {
				disabled: !!m.problem,
				onClick: () => {
					_ || c.mutate();
				},
				...M(o || c.isPending),
				children: m.installed ? "重新安装" : "安装"
			})] })
		]
	});
}
function Ce({ toast: e }) {
	let t = q({
		queryKey: S,
		queryFn: ({ signal: e }) => z(e)
	}), n = t.data;
	return n ? /* @__PURE__ */ (0, Z.jsxs)(J, { children: [
		n.collection_policy ? /* @__PURE__ */ (0, Z.jsx)(ge, {
			initial: n.collection_policy,
			toast: e
		}) : null,
		/* @__PURE__ */ (0, Z.jsx)("p", {
			className: "text-body-2-regular text-text-secondary",
			children: "高清图片可能要经代理才能下载，先检查连接。"
		}),
		/* @__PURE__ */ (0, Z.jsx)(xe, { toast: e }),
		/* @__PURE__ */ (0, Z.jsx)(me, { receipt: e }),
		(n.sources || []).map((t) => /* @__PURE__ */ (0, Z.jsx)(be, {
			source: t,
			toast: e
		}, t.source)),
		/* @__PURE__ */ (0, Z.jsx)(Se, { toast: e })
	] }) : /* @__PURE__ */ (0, Z.jsx)(J, { children: /* @__PURE__ */ (0, Z.jsx)(b, {
		tone: "error",
		title: "采集来源读取失败",
		children: t.error ? P(t.error) : "读取采集来源失败"
	}) });
}
export { Ce as ScrapingPage, _e as linkHost, $ as networkOptions };

//# debugId=e9a3e080-03f2-4b8e-a3ac-be6d0bf66699