var Indux = (function (exports) {
    'use strict';

    /*! Marked.js - MIT License */
    !function (e, t) { "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).marked = {}) }(this, (function (e) { "use strict"; function t() { return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null } } function n(t) { e.defaults = t } e.defaults = { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null }; const s = /[&<>"']/, r = new RegExp(s.source, "g"), i = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, l = new RegExp(i.source, "g"), o = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, a = e => o[e]; function c(e, t) { if (t) { if (s.test(e)) return e.replace(r, a) } else if (i.test(e)) return e.replace(l, a); return e } const h = /(^|[^\[])\^/g; function p(e, t) { let n = "string" == typeof e ? e : e.source; t = t || ""; const s = { replace: (e, t) => { let r = "string" == typeof t ? t : t.source; return r = r.replace(h, "$1"), n = n.replace(e, r), s }, getRegex: () => new RegExp(n, t) }; return s } function u(e) { try { e = encodeURI(e).replace(/%25/g, "%") } catch { return null } return e } const k = { exec: () => null }; function g(e, t) { const n = e.replace(/\|/g, ((e, t, n) => { let s = !1, r = t; for (; --r >= 0 && "\\" === n[r];)s = !s; return s ? "|" : " |" })).split(/ \|/); let s = 0; if (n[0].trim() || n.shift(), n.length > 0 && !n[n.length - 1].trim() && n.pop(), t) if (n.length > t) n.splice(t); else for (; n.length < t;)n.push(""); for (; s < n.length; s++)n[s] = n[s].trim().replace(/\\\|/g, "|"); return n } function f(e, t, n) { const s = e.length; if (0 === s) return ""; let r = 0; for (; r < s;) { const i = e.charAt(s - r - 1); if (i !== t || n) { if (i === t || !n) break; r++ } else r++ } return e.slice(0, s - r) } function d(e, t, n, s) { const r = t.href, i = t.title ? c(t.title) : null, l = e[1].replace(/\\([\[\]])/g, "$1"); if ("!" !== e[0].charAt(0)) { s.state.inLink = !0; const e = { type: "link", raw: n, href: r, title: i, text: l, tokens: s.inlineTokens(l) }; return s.state.inLink = !1, e } return { type: "image", raw: n, href: r, title: i, text: c(l) } } class x { options; rules; lexer; constructor(t) { this.options = t || e.defaults } space(e) { const t = this.rules.block.newline.exec(e); if (t && t[0].length > 0) return { type: "space", raw: t[0] } } code(e) { const t = this.rules.block.code.exec(e); if (t) { const e = t[0].replace(/^(?: {1,4}| {0,3}\t)/gm, ""); return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? e : f(e, "\n") } } } fences(e) { const t = this.rules.block.fences.exec(e); if (t) { const e = t[0], n = function (e, t) { const n = e.match(/^(\s+)(?:```)/); if (null === n) return t; const s = n[1]; return t.split("\n").map((e => { const t = e.match(/^\s+/); if (null === t) return e; const [n] = t; return n.length >= s.length ? e.slice(s.length) : e })).join("\n") }(e, t[3] || ""); return { type: "code", raw: e, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: n } } } heading(e) { const t = this.rules.block.heading.exec(e); if (t) { let e = t[2].trim(); if (/#$/.test(e)) { const t = f(e, "#"); this.options.pedantic ? e = t.trim() : t && !/ $/.test(t) || (e = t.trim()) } return { type: "heading", raw: t[0], depth: t[1].length, text: e, tokens: this.lexer.inline(e) } } } hr(e) { const t = this.rules.block.hr.exec(e); if (t) return { type: "hr", raw: f(t[0], "\n") } } blockquote(e) { const t = this.rules.block.blockquote.exec(e); if (t) { let e = f(t[0], "\n").split("\n"), n = "", s = ""; const r = []; for (; e.length > 0;) { let t = !1; const i = []; let l; for (l = 0; l < e.length; l++)if (/^ {0,3}>/.test(e[l])) i.push(e[l]), t = !0; else { if (t) break; i.push(e[l]) } e = e.slice(l); const o = i.join("\n"), a = o.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, "\n    $1").replace(/^ {0,3}>[ \t]?/gm, ""); n = n ? `${n}\n${o}` : o, s = s ? `${s}\n${a}` : a; const c = this.lexer.state.top; if (this.lexer.state.top = !0, this.lexer.blockTokens(a, r, !0), this.lexer.state.top = c, 0 === e.length) break; const h = r[r.length - 1]; if ("code" === h?.type) break; if ("blockquote" === h?.type) { const t = h, i = t.raw + "\n" + e.join("\n"), l = this.blockquote(i); r[r.length - 1] = l, n = n.substring(0, n.length - t.raw.length) + l.raw, s = s.substring(0, s.length - t.text.length) + l.text; break } if ("list" !== h?.type); else { const t = h, i = t.raw + "\n" + e.join("\n"), l = this.list(i); r[r.length - 1] = l, n = n.substring(0, n.length - h.raw.length) + l.raw, s = s.substring(0, s.length - t.raw.length) + l.raw, e = i.substring(r[r.length - 1].raw.length).split("\n") } } return { type: "blockquote", raw: n, tokens: r, text: s } } } list(e) { let t = this.rules.block.list.exec(e); if (t) { let n = t[1].trim(); const s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: !1, items: [] }; n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]"); const i = new RegExp(`^( {0,3}${n})((?:[\t ][^\\n]*)?(?:\\n|$))`); let l = !1; for (; e;) { let n = !1, s = "", o = ""; if (!(t = i.exec(e))) break; if (this.rules.block.hr.test(e)) break; s = t[0], e = e.substring(s.length); let a = t[2].split("\n", 1)[0].replace(/^\t+/, (e => " ".repeat(3 * e.length))), c = e.split("\n", 1)[0], h = !a.trim(), p = 0; if (this.options.pedantic ? (p = 2, o = a.trimStart()) : h ? p = t[1].length + 1 : (p = t[2].search(/[^ ]/), p = p > 4 ? 1 : p, o = a.slice(p), p += t[1].length), h && /^[ \t]*$/.test(c) && (s += c + "\n", e = e.substring(c.length + 1), n = !0), !n) { const t = new RegExp(`^ {0,${Math.min(3, p - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`), n = new RegExp(`^ {0,${Math.min(3, p - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), r = new RegExp(`^ {0,${Math.min(3, p - 1)}}(?:\`\`\`|~~~)`), i = new RegExp(`^ {0,${Math.min(3, p - 1)}}#`), l = new RegExp(`^ {0,${Math.min(3, p - 1)}}<[a-z].*>`, "i"); for (; e;) { const u = e.split("\n", 1)[0]; let k; if (c = u, this.options.pedantic ? (c = c.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), k = c) : k = c.replace(/\t/g, "    "), r.test(c)) break; if (i.test(c)) break; if (l.test(c)) break; if (t.test(c)) break; if (n.test(c)) break; if (k.search(/[^ ]/) >= p || !c.trim()) o += "\n" + k.slice(p); else { if (h) break; if (a.replace(/\t/g, "    ").search(/[^ ]/) >= 4) break; if (r.test(a)) break; if (i.test(a)) break; if (n.test(a)) break; o += "\n" + c } h || c.trim() || (h = !0), s += u + "\n", e = e.substring(u.length + 1), a = k.slice(p) } } r.loose || (l ? r.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(s) && (l = !0)); let u, k = null; this.options.gfm && (k = /^\[[ xX]\] /.exec(o), k && (u = "[ ] " !== k[0], o = o.replace(/^\[[ xX]\] +/, ""))), r.items.push({ type: "list_item", raw: s, task: !!k, checked: u, loose: !1, text: o, tokens: [] }), r.raw += s } r.items[r.items.length - 1].raw = r.items[r.items.length - 1].raw.trimEnd(), r.items[r.items.length - 1].text = r.items[r.items.length - 1].text.trimEnd(), r.raw = r.raw.trimEnd(); for (let e = 0; e < r.items.length; e++)if (this.lexer.state.top = !1, r.items[e].tokens = this.lexer.blockTokens(r.items[e].text, []), !r.loose) { const t = r.items[e].tokens.filter((e => "space" === e.type)), n = t.length > 0 && t.some((e => /\n.*\n/.test(e.raw))); r.loose = n } if (r.loose) for (let e = 0; e < r.items.length; e++)r.items[e].loose = !0; return r } } html(e) { const t = this.rules.block.html.exec(e); if (t) { return { type: "html", block: !0, raw: t[0], pre: "pre" === t[1] || "script" === t[1] || "style" === t[1], text: t[0] } } } def(e) { const t = this.rules.block.def.exec(e); if (t) { const e = t[1].toLowerCase().replace(/\s+/g, " "), n = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3]; return { type: "def", tag: e, raw: t[0], href: n, title: s } } } table(e) { const t = this.rules.block.table.exec(e); if (!t) return; if (!/[:|]/.test(t[2])) return; const n = g(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), r = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split("\n") : [], i = { type: "table", raw: t[0], header: [], align: [], rows: [] }; if (n.length === s.length) { for (const e of s) /^ *-+: *$/.test(e) ? i.align.push("right") : /^ *:-+: *$/.test(e) ? i.align.push("center") : /^ *:-+ *$/.test(e) ? i.align.push("left") : i.align.push(null); for (let e = 0; e < n.length; e++)i.header.push({ text: n[e], tokens: this.lexer.inline(n[e]), header: !0, align: i.align[e] }); for (const e of r) i.rows.push(g(e, i.header.length).map(((e, t) => ({ text: e, tokens: this.lexer.inline(e), header: !1, align: i.align[t] })))); return i } } lheading(e) { const t = this.rules.block.lheading.exec(e); if (t) return { type: "heading", raw: t[0], depth: "=" === t[2].charAt(0) ? 1 : 2, text: t[1], tokens: this.lexer.inline(t[1]) } } paragraph(e) { const t = this.rules.block.paragraph.exec(e); if (t) { const e = "\n" === t[1].charAt(t[1].length - 1) ? t[1].slice(0, -1) : t[1]; return { type: "paragraph", raw: t[0], text: e, tokens: this.lexer.inline(e) } } } text(e) { const t = this.rules.block.text.exec(e); if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) } } escape(e) { const t = this.rules.inline.escape.exec(e); if (t) return { type: "escape", raw: t[0], text: c(t[1]) } } tag(e) { const t = this.rules.inline.tag.exec(e); if (t) return !this.lexer.state.inLink && /^<a /i.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: t[0] } } link(e) { const t = this.rules.inline.link.exec(e); if (t) { const e = t[2].trim(); if (!this.options.pedantic && /^</.test(e)) { if (!/>$/.test(e)) return; const t = f(e.slice(0, -1), "\\"); if ((e.length - t.length) % 2 == 0) return } else { const e = function (e, t) { if (-1 === e.indexOf(t[1])) return -1; let n = 0; for (let s = 0; s < e.length; s++)if ("\\" === e[s]) s++; else if (e[s] === t[0]) n++; else if (e[s] === t[1] && (n--, n < 0)) return s; return -1 }(t[2], "()"); if (e > -1) { const n = (0 === t[0].indexOf("!") ? 5 : 4) + t[1].length + e; t[2] = t[2].substring(0, e), t[0] = t[0].substring(0, n).trim(), t[3] = "" } } let n = t[2], s = ""; if (this.options.pedantic) { const e = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(n); e && (n = e[1], s = e[3]) } else s = t[3] ? t[3].slice(1, -1) : ""; return n = n.trim(), /^</.test(n) && (n = this.options.pedantic && !/>$/.test(e) ? n.slice(1) : n.slice(1, -1)), d(t, { href: n ? n.replace(this.rules.inline.anyPunctuation, "$1") : n, title: s ? s.replace(this.rules.inline.anyPunctuation, "$1") : s }, t[0], this.lexer) } } reflink(e, t) { let n; if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) { const e = t[(n[2] || n[1]).replace(/\s+/g, " ").toLowerCase()]; if (!e) { const e = n[0].charAt(0); return { type: "text", raw: e, text: e } } return d(n, e, n[0], this.lexer) } } emStrong(e, t, n = "") { let s = this.rules.inline.emStrongLDelim.exec(e); if (!s) return; if (s[3] && n.match(/[\p{L}\p{N}]/u)) return; if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) { const n = [...s[0]].length - 1; let r, i, l = n, o = 0; const a = "*" === s[0][0] ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd; for (a.lastIndex = 0, t = t.slice(-1 * e.length + n); null != (s = a.exec(t));) { if (r = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !r) continue; if (i = [...r].length, s[3] || s[4]) { l += i; continue } if ((s[5] || s[6]) && n % 3 && !((n + i) % 3)) { o += i; continue } if (l -= i, l > 0) continue; i = Math.min(i, i + l + o); const t = [...s[0]][0].length, a = e.slice(0, n + s.index + t + i); if (Math.min(n, i) % 2) { const e = a.slice(1, -1); return { type: "em", raw: a, text: e, tokens: this.lexer.inlineTokens(e) } } const c = a.slice(2, -2); return { type: "strong", raw: a, text: c, tokens: this.lexer.inlineTokens(c) } } } } codespan(e) { const t = this.rules.inline.code.exec(e); if (t) { let e = t[2].replace(/\n/g, " "); const n = /[^ ]/.test(e), s = /^ /.test(e) && / $/.test(e); return n && s && (e = e.substring(1, e.length - 1)), e = c(e, !0), { type: "codespan", raw: t[0], text: e } } } br(e) { const t = this.rules.inline.br.exec(e); if (t) return { type: "br", raw: t[0] } } del(e) { const t = this.rules.inline.del.exec(e); if (t) return { type: "del", raw: t[0], text: t[2], tokens: this.lexer.inlineTokens(t[2]) } } autolink(e) { const t = this.rules.inline.autolink.exec(e); if (t) { let e, n; return "@" === t[2] ? (e = c(t[1]), n = "mailto:" + e) : (e = c(t[1]), n = e), { type: "link", raw: t[0], text: e, href: n, tokens: [{ type: "text", raw: e, text: e }] } } } url(e) { let t; if (t = this.rules.inline.url.exec(e)) { let e, n; if ("@" === t[2]) e = c(t[0]), n = "mailto:" + e; else { let s; do { s = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "" } while (s !== t[0]); e = c(t[0]), n = "www." === t[1] ? "http://" + t[0] : t[0] } return { type: "link", raw: t[0], text: e, href: n, tokens: [{ type: "text", raw: e, text: e }] } } } inlineText(e) { const t = this.rules.inline.text.exec(e); if (t) { let e; return e = this.lexer.state.inRawBlock ? t[0] : c(t[0]), { type: "text", raw: t[0], text: e } } } } const b = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, w = /(?:[*+-]|\d{1,9}[.)])/, m = p(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, w).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), y = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, $ = /(?!\s*\])(?:\\.|[^\[\]\\])+/, z = p(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", $).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), T = p(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, w).getRegex(), R = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", _ = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, A = p("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i").replace("comment", _).replace("tag", R).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), S = p(y).replace("hr", b).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", R).getRegex(), I = { blockquote: p(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", S).getRegex(), code: /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, def: z, fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, hr: b, html: A, lheading: m, list: T, newline: /^(?:[ \t]*(?:\n|$))+/, paragraph: S, table: k, text: /^[^\n]+/ }, E = p("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", b).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}\t)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", R).getRegex(), q = { ...I, table: E, paragraph: p(y).replace("hr", b).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", E).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", R).getRegex() }, Z = { ...I, html: p("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", _).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: k, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: p(y).replace("hr", b).replace("heading", " *#{1,6} *[^\n]").replace("lheading", m).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, P = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, L = /^( {2,}|\\)\n(?!\s*$)/, v = "\\p{P}\\p{S}", Q = p(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, v).getRegex(), B = p(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, v).getRegex(), M = p("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, v).getRegex(), O = p("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, v).getRegex(), j = p(/\\([punct])/, "gu").replace(/punct/g, v).getRegex(), D = p(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), C = p(_).replace("(?:--\x3e|$)", "--\x3e").getRegex(), H = p("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", C).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), U = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, X = p(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", U).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), F = p(/^!?\[(label)\]\[(ref)\]/).replace("label", U).replace("ref", $).getRegex(), N = p(/^!?\[(ref)\](?:\[\])?/).replace("ref", $).getRegex(), G = { _backpedal: k, anyPunctuation: j, autolink: D, blockSkip: /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, br: L, code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, del: k, emStrongLDelim: B, emStrongRDelimAst: M, emStrongRDelimUnd: O, escape: P, link: X, nolink: N, punctuation: Q, reflink: F, reflinkSearch: p("reflink|nolink(?!\\()", "g").replace("reflink", F).replace("nolink", N).getRegex(), tag: H, text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, url: k }, J = { ...G, link: p(/^!?\[(label)\]\((.*?)\)/).replace("label", U).getRegex(), reflink: p(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", U).getRegex() }, K = { ...G, escape: p(P).replace("])", "~|])").getRegex(), url: p(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/, text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/ }, V = { ...K, br: p(L).replace("{2,}", "*").getRegex(), text: p(K.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, W = { normal: I, gfm: q, pedantic: Z }, Y = { normal: G, gfm: K, breaks: V, pedantic: J }; class ee { tokens; options; state; tokenizer; inlineQueue; constructor(t) { this.tokens = [], this.tokens.links = Object.create(null), this.options = t || e.defaults, this.options.tokenizer = this.options.tokenizer || new x, this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 }; const n = { block: W.normal, inline: Y.normal }; this.options.pedantic ? (n.block = W.pedantic, n.inline = Y.pedantic) : this.options.gfm && (n.block = W.gfm, this.options.breaks ? n.inline = Y.breaks : n.inline = Y.gfm), this.tokenizer.rules = n } static get rules() { return { block: W, inline: Y } } static lex(e, t) { return new ee(t).lex(e) } static lexInline(e, t) { return new ee(t).inlineTokens(e) } lex(e) { e = e.replace(/\r\n|\r/g, "\n"), this.blockTokens(e, this.tokens); for (let e = 0; e < this.inlineQueue.length; e++) { const t = this.inlineQueue[e]; this.inlineTokens(t.src, t.tokens) } return this.inlineQueue = [], this.tokens } blockTokens(e, t = [], n = !1) { let s, r, i; for (this.options.pedantic && (e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "")); e;)if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((n => !!(s = n.call({ lexer: this }, e, t)) && (e = e.substring(s.raw.length), t.push(s), !0))))) if (s = this.tokenizer.space(e)) e = e.substring(s.raw.length), 1 === s.raw.length && t.length > 0 ? t[t.length - 1].raw += "\n" : t.push(s); else if (s = this.tokenizer.code(e)) e = e.substring(s.raw.length), r = t[t.length - 1], !r || "paragraph" !== r.type && "text" !== r.type ? t.push(s) : (r.raw += "\n" + s.raw, r.text += "\n" + s.text, this.inlineQueue[this.inlineQueue.length - 1].src = r.text); else if (s = this.tokenizer.fences(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.heading(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.hr(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.blockquote(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.list(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.html(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.def(e)) e = e.substring(s.raw.length), r = t[t.length - 1], !r || "paragraph" !== r.type && "text" !== r.type ? this.tokens.links[s.tag] || (this.tokens.links[s.tag] = { href: s.href, title: s.title }) : (r.raw += "\n" + s.raw, r.text += "\n" + s.raw, this.inlineQueue[this.inlineQueue.length - 1].src = r.text); else if (s = this.tokenizer.table(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.lheading(e)) e = e.substring(s.raw.length), t.push(s); else { if (i = e, this.options.extensions && this.options.extensions.startBlock) { let t = 1 / 0; const n = e.slice(1); let s; this.options.extensions.startBlock.forEach((e => { s = e.call({ lexer: this }, n), "number" == typeof s && s >= 0 && (t = Math.min(t, s)) })), t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1)) } if (this.state.top && (s = this.tokenizer.paragraph(i))) r = t[t.length - 1], n && "paragraph" === r?.type ? (r.raw += "\n" + s.raw, r.text += "\n" + s.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : t.push(s), n = i.length !== e.length, e = e.substring(s.raw.length); else if (s = this.tokenizer.text(e)) e = e.substring(s.raw.length), r = t[t.length - 1], r && "text" === r.type ? (r.raw += "\n" + s.raw, r.text += "\n" + s.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : t.push(s); else if (e) { const t = "Infinite loop on byte: " + e.charCodeAt(0); if (this.options.silent) { console.error(t); break } throw new Error(t) } } return this.state.top = !0, t } inline(e, t = []) { return this.inlineQueue.push({ src: e, tokens: t }), t } inlineTokens(e, t = []) { let n, s, r, i, l, o, a = e; if (this.tokens.links) { const e = Object.keys(this.tokens.links); if (e.length > 0) for (; null != (i = this.tokenizer.rules.inline.reflinkSearch.exec(a));)e.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex)) } for (; null != (i = this.tokenizer.rules.inline.blockSkip.exec(a));)a = a.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex); for (; null != (i = this.tokenizer.rules.inline.anyPunctuation.exec(a));)a = a.slice(0, i.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex); for (; e;)if (l || (o = ""), l = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((s => !!(n = s.call({ lexer: this }, e, t)) && (e = e.substring(n.raw.length), t.push(n), !0))))) if (n = this.tokenizer.escape(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.tag(e)) e = e.substring(n.raw.length), s = t[t.length - 1], s && "text" === n.type && "text" === s.type ? (s.raw += n.raw, s.text += n.text) : t.push(n); else if (n = this.tokenizer.link(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.reflink(e, this.tokens.links)) e = e.substring(n.raw.length), s = t[t.length - 1], s && "text" === n.type && "text" === s.type ? (s.raw += n.raw, s.text += n.text) : t.push(n); else if (n = this.tokenizer.emStrong(e, a, o)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.codespan(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.br(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.del(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.autolink(e)) e = e.substring(n.raw.length), t.push(n); else if (this.state.inLink || !(n = this.tokenizer.url(e))) { if (r = e, this.options.extensions && this.options.extensions.startInline) { let t = 1 / 0; const n = e.slice(1); let s; this.options.extensions.startInline.forEach((e => { s = e.call({ lexer: this }, n), "number" == typeof s && s >= 0 && (t = Math.min(t, s)) })), t < 1 / 0 && t >= 0 && (r = e.substring(0, t + 1)) } if (n = this.tokenizer.inlineText(r)) e = e.substring(n.raw.length), "_" !== n.raw.slice(-1) && (o = n.raw.slice(-1)), l = !0, s = t[t.length - 1], s && "text" === s.type ? (s.raw += n.raw, s.text += n.text) : t.push(n); else if (e) { const t = "Infinite loop on byte: " + e.charCodeAt(0); if (this.options.silent) { console.error(t); break } throw new Error(t) } } else e = e.substring(n.raw.length), t.push(n); return t } } class te { options; parser; constructor(t) { this.options = t || e.defaults } space(e) { return "" } code({ text: e, lang: t, escaped: n }) { const s = (t || "").match(/^\S*/)?.[0], r = e.replace(/\n$/, "") + "\n"; return s ? '<pre><code class="language-' + c(s) + '">' + (n ? r : c(r, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? r : c(r, !0)) + "</code></pre>\n" } blockquote({ tokens: e }) { return `<blockquote>\n${this.parser.parse(e)}</blockquote>\n` } html({ text: e }) { return e } heading({ tokens: e, depth: t }) { return `<h${t}>${this.parser.parseInline(e)}</h${t}>\n` } hr(e) { return "<hr>\n" } list(e) { const t = e.ordered, n = e.start; let s = ""; for (let t = 0; t < e.items.length; t++) { const n = e.items[t]; s += this.listitem(n) } const r = t ? "ol" : "ul"; return "<" + r + (t && 1 !== n ? ' start="' + n + '"' : "") + ">\n" + s + "</" + r + ">\n" } listitem(e) { let t = ""; if (e.task) { const n = this.checkbox({ checked: !!e.checked }); e.loose ? e.tokens.length > 0 && "paragraph" === e.tokens[0].type ? (e.tokens[0].text = n + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && "text" === e.tokens[0].tokens[0].type && (e.tokens[0].tokens[0].text = n + " " + e.tokens[0].tokens[0].text)) : e.tokens.unshift({ type: "text", raw: n + " ", text: n + " " }) : t += n + " " } return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>\n` } checkbox({ checked: e }) { return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">' } paragraph({ tokens: e }) { return `<p>${this.parser.parseInline(e)}</p>\n` } table(e) { let t = "", n = ""; for (let t = 0; t < e.header.length; t++)n += this.tablecell(e.header[t]); t += this.tablerow({ text: n }); let s = ""; for (let t = 0; t < e.rows.length; t++) { const r = e.rows[t]; n = ""; for (let e = 0; e < r.length; e++)n += this.tablecell(r[e]); s += this.tablerow({ text: n }) } return s && (s = `<tbody>${s}</tbody>`), "<table>\n<thead>\n" + t + "</thead>\n" + s + "</table>\n" } tablerow({ text: e }) { return `<tr>\n${e}</tr>\n` } tablecell(e) { const t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td"; return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>\n` } strong({ tokens: e }) { return `<strong>${this.parser.parseInline(e)}</strong>` } em({ tokens: e }) { return `<em>${this.parser.parseInline(e)}</em>` } codespan({ text: e }) { return `<code>${e}</code>` } br(e) { return "<br>" } del({ tokens: e }) { return `<del>${this.parser.parseInline(e)}</del>` } link({ href: e, title: t, tokens: n }) { const s = this.parser.parseInline(n), r = u(e); if (null === r) return s; let i = '<a href="' + (e = r) + '"'; return t && (i += ' title="' + t + '"'), i += ">" + s + "</a>", i } image({ href: e, title: t, text: n }) { const s = u(e); if (null === s) return n; let r = `<img src="${e = s}" alt="${n}"`; return t && (r += ` title="${t}"`), r += ">", r } text(e) { return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : e.text } } class ne { strong({ text: e }) { return e } em({ text: e }) { return e } codespan({ text: e }) { return e } del({ text: e }) { return e } html({ text: e }) { return e } text({ text: e }) { return e } link({ text: e }) { return "" + e } image({ text: e }) { return "" + e } br() { return "" } } class se { options; renderer; textRenderer; constructor(t) { this.options = t || e.defaults, this.options.renderer = this.options.renderer || new te, this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new ne } static parse(e, t) { return new se(t).parse(e) } static parseInline(e, t) { return new se(t).parseInline(e) } parse(e, t = !0) { let n = ""; for (let s = 0; s < e.length; s++) { const r = e[s]; if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) { const e = r, t = this.options.extensions.renderers[e.type].call({ parser: this }, e); if (!1 !== t || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(e.type)) { n += t || ""; continue } } const i = r; switch (i.type) { case "space": n += this.renderer.space(i); continue; case "hr": n += this.renderer.hr(i); continue; case "heading": n += this.renderer.heading(i); continue; case "code": n += this.renderer.code(i); continue; case "table": n += this.renderer.table(i); continue; case "blockquote": n += this.renderer.blockquote(i); continue; case "list": n += this.renderer.list(i); continue; case "html": n += this.renderer.html(i); continue; case "paragraph": n += this.renderer.paragraph(i); continue; case "text": { let r = i, l = this.renderer.text(r); for (; s + 1 < e.length && "text" === e[s + 1].type;)r = e[++s], l += "\n" + this.renderer.text(r); n += t ? this.renderer.paragraph({ type: "paragraph", raw: l, text: l, tokens: [{ type: "text", raw: l, text: l }] }) : l; continue } default: { const e = 'Token with "' + i.type + '" type was not found.'; if (this.options.silent) return console.error(e), ""; throw new Error(e) } } } return n } parseInline(e, t) { t = t || this.renderer; let n = ""; for (let s = 0; s < e.length; s++) { const r = e[s]; if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) { const e = this.options.extensions.renderers[r.type].call({ parser: this }, r); if (!1 !== e || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) { n += e || ""; continue } } const i = r; switch (i.type) { case "escape": case "text": n += t.text(i); break; case "html": n += t.html(i); break; case "link": n += t.link(i); break; case "image": n += t.image(i); break; case "strong": n += t.strong(i); break; case "em": n += t.em(i); break; case "codespan": n += t.codespan(i); break; case "br": n += t.br(i); break; case "del": n += t.del(i); break; default: { const e = 'Token with "' + i.type + '" type was not found.'; if (this.options.silent) return console.error(e), ""; throw new Error(e) } } } return n } } class re { options; block; constructor(t) { this.options = t || e.defaults } static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens"]); preprocess(e) { return e } postprocess(e) { return e } processAllTokens(e) { return e } provideLexer() { return this.block ? ee.lex : ee.lexInline } provideParser() { return this.block ? se.parse : se.parseInline } } class ie { defaults = { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null }; options = this.setOptions; parse = this.parseMarkdown(!0); parseInline = this.parseMarkdown(!1); Parser = se; Renderer = te; TextRenderer = ne; Lexer = ee; Tokenizer = x; Hooks = re; constructor(...e) { this.use(...e) } walkTokens(e, t) { let n = []; for (const s of e) switch (n = n.concat(t.call(this, s)), s.type) { case "table": { const e = s; for (const s of e.header) n = n.concat(this.walkTokens(s.tokens, t)); for (const s of e.rows) for (const e of s) n = n.concat(this.walkTokens(e.tokens, t)); break } case "list": { const e = s; n = n.concat(this.walkTokens(e.items, t)); break } default: { const e = s; this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((s => { const r = e[s].flat(1 / 0); n = n.concat(this.walkTokens(r, t)) })) : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t))) } }return n } use(...e) { const t = this.defaults.extensions || { renderers: {}, childTokens: {} }; return e.forEach((e => { const n = { ...e }; if (n.async = this.defaults.async || n.async || !1, e.extensions && (e.extensions.forEach((e => { if (!e.name) throw new Error("extension name required"); if ("renderer" in e) { const n = t.renderers[e.name]; t.renderers[e.name] = n ? function (...t) { let s = e.renderer.apply(this, t); return !1 === s && (s = n.apply(this, t)), s } : e.renderer } if ("tokenizer" in e) { if (!e.level || "block" !== e.level && "inline" !== e.level) throw new Error("extension level must be 'block' or 'inline'"); const n = t[e.level]; n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer], e.start && ("block" === e.level ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : "inline" === e.level && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start])) } "childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens) })), n.extensions = t), e.renderer) { const t = this.defaults.renderer || new te(this.defaults); for (const n in e.renderer) { if (!(n in t)) throw new Error(`renderer '${n}' does not exist`); if (["options", "parser"].includes(n)) continue; const s = n, r = e.renderer[s], i = t[s]; t[s] = (...e) => { let n = r.apply(t, e); return !1 === n && (n = i.apply(t, e)), n || "" } } n.renderer = t } if (e.tokenizer) { const t = this.defaults.tokenizer || new x(this.defaults); for (const n in e.tokenizer) { if (!(n in t)) throw new Error(`tokenizer '${n}' does not exist`); if (["options", "rules", "lexer"].includes(n)) continue; const s = n, r = e.tokenizer[s], i = t[s]; t[s] = (...e) => { let n = r.apply(t, e); return !1 === n && (n = i.apply(t, e)), n } } n.tokenizer = t } if (e.hooks) { const t = this.defaults.hooks || new re; for (const n in e.hooks) { if (!(n in t)) throw new Error(`hook '${n}' does not exist`); if (["options", "block"].includes(n)) continue; const s = n, r = e.hooks[s], i = t[s]; re.passThroughHooks.has(n) ? t[s] = e => { if (this.defaults.async) return Promise.resolve(r.call(t, e)).then((e => i.call(t, e))); const n = r.call(t, e); return i.call(t, n) } : t[s] = (...e) => { let n = r.apply(t, e); return !1 === n && (n = i.apply(t, e)), n } } n.hooks = t } if (e.walkTokens) { const t = this.defaults.walkTokens, s = e.walkTokens; n.walkTokens = function (e) { let n = []; return n.push(s.call(this, e)), t && (n = n.concat(t.call(this, e))), n } } this.defaults = { ...this.defaults, ...n } })), this } setOptions(e) { return this.defaults = { ...this.defaults, ...e }, this } lexer(e, t) { return ee.lex(e, t ?? this.defaults) } parser(e, t) { return se.parse(e, t ?? this.defaults) } parseMarkdown(e) { return (t, n) => { const s = { ...n }, r = { ...this.defaults, ...s }, i = this.onError(!!r.silent, !!r.async); if (!0 === this.defaults.async && !1 === s.async) return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.")); if (null == t) return i(new Error("marked(): input parameter is undefined or null")); if ("string" != typeof t) return i(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected")); r.hooks && (r.hooks.options = r, r.hooks.block = e); const l = r.hooks ? r.hooks.provideLexer() : e ? ee.lex : ee.lexInline, o = r.hooks ? r.hooks.provideParser() : e ? se.parse : se.parseInline; if (r.async) return Promise.resolve(r.hooks ? r.hooks.preprocess(t) : t).then((e => l(e, r))).then((e => r.hooks ? r.hooks.processAllTokens(e) : e)).then((e => r.walkTokens ? Promise.all(this.walkTokens(e, r.walkTokens)).then((() => e)) : e)).then((e => o(e, r))).then((e => r.hooks ? r.hooks.postprocess(e) : e)).catch(i); try { r.hooks && (t = r.hooks.preprocess(t)); let e = l(t, r); r.hooks && (e = r.hooks.processAllTokens(e)), r.walkTokens && this.walkTokens(e, r.walkTokens); let n = o(e, r); return r.hooks && (n = r.hooks.postprocess(n)), n } catch (e) { return i(e) } } } onError(e, t) { return n => { if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) { const e = "<p>An error occurred:</p><pre>" + c(n.message + "", !0) + "</pre>"; return t ? Promise.resolve(e) : e } if (t) return Promise.reject(n); throw n } } } const le = new ie; function oe(e, t) { return le.parse(e, t) } oe.options = oe.setOptions = function (e) { return le.setOptions(e), oe.defaults = le.defaults, n(oe.defaults), oe }, oe.getDefaults = t, oe.defaults = e.defaults, oe.use = function (...e) { return le.use(...e), oe.defaults = le.defaults, n(oe.defaults), oe }, oe.walkTokens = function (e, t) { return le.walkTokens(e, t) }, oe.parseInline = le.parseInline, oe.Parser = se, oe.parser = se.parse, oe.Renderer = te, oe.TextRenderer = ne, oe.Lexer = ee, oe.lexer = ee.lex, oe.Tokenizer = x, oe.Hooks = re, oe.parse = oe; const ae = oe.options, ce = oe.setOptions, he = oe.use, pe = oe.walkTokens, ue = oe.parseInline, ke = oe, ge = se.parse, fe = ee.lex; e.Hooks = re, e.Lexer = ee, e.Marked = ie, e.Parser = se, e.Renderer = te, e.TextRenderer = ne, e.Tokenizer = x, e.getDefaults = t, e.lexer = fe, e.marked = oe, e.options = ae, e.parse = ke, e.parseInline = ue, e.parser = ge, e.setOptions = ce, e.use = he, e.walkTokens = pe }));

    /*! Indux Components 1.0.0 - MIT License */



    window.InduxComponentsRegistry = {
        manifest: null,
        registered: new Set(),
        preloaded: [],
        initialize() {
            // Load manifest.json synchronously
            try {
                const req = new XMLHttpRequest();
                req.open('GET', '/manifest.json?t=' + Date.now(), false);
                req.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                req.setRequestHeader('Pragma', 'no-cache');
                req.setRequestHeader('Expires', '0');
                req.send(null);
                if (req.status === 200) {
                    this.manifest = JSON.parse(req.responseText);
                    // Register all components from manifest
                    const allComponents = [
                        ...(this.manifest?.preloadedComponents || []),
                        ...(this.manifest?.components || [])
                    ];
                    allComponents.forEach(path => {
                        const name = path.split('/').pop().replace('.html', '');
                        this.registered.add(name);
                    });
                    this.preloaded = (this.manifest?.preloadedComponents || []).map(path => path.split('/').pop().replace('.html', ''));
                } else {
                    console.warn('[Indux] Failed to load manifest.json (HTTP', req.status + ')');
                }
            } catch (e) {
                console.warn('[Indux] Failed to load manifest.json:', e.message);
            }
        }
    }; 

    window.InduxComponentsLoader = {
        cache: {},
        initialize() {
            this.cache = {};
            // Preload components listed in registry.preloaded
            const registry = window.InduxComponentsRegistry;
            if (registry && Array.isArray(registry.preloaded)) {
                registry.preloaded.forEach(name => {
                    this.loadComponent(name).then(() => {
                        // Preloaded component
                    });
                });
            }
        },
        async loadComponent(name) {
            if (this.cache[name]) {
                return this.cache[name];
            }
            const registry = window.InduxComponentsRegistry;
            if (!registry || !registry.manifest) {
                console.warn('[Indux] Manifest not loaded, cannot load component:', name);
                return null;
            }
            const path = (registry.manifest.preloadedComponents || []).concat(registry.manifest.components || [])
                .find(p => p.split('/').pop().replace('.html', '') === name);
            if (!path) {
                console.warn('[Indux] Component', name, 'not found in manifest.');
                return null;
            }
            try {
                const response = await fetch('/' + path);
                if (!response.ok) {
                    console.warn('[Indux] HTML file not found for component', name, 'at path:', path, '(HTTP', response.status + ')');
                    return null;
                }
                const content = await response.text();
                this.cache[name] = content;
                return content;
            } catch (error) {
                console.warn('[Indux] Failed to load component', name, 'from', path + ':', error.message);
                return null;
            }
        }
    }; 

    window.InduxComponentsProcessor = {
        async processComponent(element, instanceId) {
            const name = element.tagName.toLowerCase().replace('x-', '');
            const registry = window.InduxComponentsRegistry;
            const loader = window.InduxComponentsLoader;
            if (!registry || !loader) {
                return;
            }
            if (!registry.registered.has(name)) {
                return;
            }
            if (element.hasAttribute('data-pre-rendered') || element.hasAttribute('data-processed')) {
                return;
            }
            const content = await loader.loadComponent(name);
            if (!content) {
                element.replaceWith(document.createComment(` Failed to load component: ${name} `));
                return;
            }
            const container = document.createElement('div');
            container.innerHTML = content.trim();
            const topLevelElements = Array.from(container.children);
            if (topLevelElements.length === 0) {
                element.replaceWith(document.createComment(` Empty component: ${name} `));
                return;
            }
            // Collect properties from placeholder attributes
            const props = {};
            Array.from(element.attributes).forEach(attr => {
                if (attr.name !== name && attr.name !== 'class' && !attr.name.startsWith('data-')) {
                    props[attr.name.toLowerCase()] = attr.value;
                }
            });
            // Process $attribute usage in all elements
            const processElementProps = (el) => {
                Array.from(el.attributes).forEach(attr => {
                    const value = attr.value.trim();
                    if (value.includes('$attribute(')) {
                        const propMatch = value.match(/\$attribute\(['"]([^'"]+)['"]\)/);
                        if (propMatch) {
                            const propName = propMatch[1].toLowerCase();
                            const propValue = props[propName] || '';
                            if (attr.name === 'class') {
                                const existingClasses = el.getAttribute('class') || '';
                                const newClasses = existingClasses
                                    .replace(new RegExp(`\$attribute\(['"]${propName}['"]\)`, 'i'), propValue)
                                    .split(' ')
                                    .filter(Boolean)
                                    .join(' ');
                                el.setAttribute('class', newClasses);
                            } else if (
                                attr.name.startsWith('x-') ||
                                attr.name.startsWith(':') ||
                                attr.name.startsWith('@') ||
                                attr.name.startsWith('x-bind:') ||
                                attr.name.startsWith('x-on:')
                            ) {
                                const escapedValue = propValue
                                    .replace(/\\/g, '\\\\')
                                    .replace(/'/g, "\\'")
                                    .replace(/\"/g, '\\"')
                                    .replace(/`/g, '\\`');
                                if (value !== `$attribute('${propName}')`) {
                                    const newValue = value.replace(
                                        /\$attribute\(['"]([^'"]+)['"]\)/g,
                                        (_, name) => `\`${props[name.toLowerCase()] || ''}\``
                                    );
                                    el.setAttribute(attr.name, newValue);
                                } else {
                                    el.setAttribute(attr.name, `\`${escapedValue}\``);
                                }
                            } else {
                                el.setAttribute(attr.name, propValue);
                            }
                        }
                    }
                });
                Array.from(el.children).forEach(processElementProps);
            };
            topLevelElements.forEach(processElementProps);
            // Apply attributes from placeholder to root elements
            topLevelElements.forEach(rootElement => {
                Array.from(element.attributes).forEach(attr => {
                    if (attr.name === 'class') {
                        const existingClass = rootElement.getAttribute('class') || '';
                        const newClasses = `${existingClass} ${attr.value}`.trim();
                        rootElement.setAttribute('class', newClasses);
                    } else if (attr.name.startsWith('x-') || attr.name.startsWith(':') || attr.name.startsWith('@')) {
                        rootElement.setAttribute(attr.name, attr.value);
                    } else if (attr.name !== name && !attr.name.startsWith('data-')) {
                        rootElement.setAttribute(attr.name, attr.value);
                    }
                    // Preserve important data attributes including data-order
                    else if (attr.name === 'data-order' || attr.name === 'x-route' || attr.name === 'data-head') {
                        rootElement.setAttribute(attr.name, attr.value);
                    }
                });
                // Set data-component=instanceId if provided
                if (instanceId) {
                    rootElement.setAttribute('data-component', instanceId);
                }
            });
            // After rendering, copy all attributes from the original placeholder to the first top-level element
            if (topLevelElements.length > 0) {
                const firstRoot = topLevelElements[0];
                Array.from(element.attributes).forEach(attr => {
                    // Preserve important attributes including data-order, x-route, and other routing/data attributes
                    const preserveAttributes = [
                        'data-order', 'x-route', 'data-component', 'data-head',
                        'x-route-*', 'data-route-*'
                    ];
                    const shouldPreserve = preserveAttributes.some(preserveAttr =>
                        attr.name === preserveAttr || attr.name.startsWith(preserveAttr.replace('*', ''))
                    );

                    if (!['data-original-placeholder', 'data-pre-rendered', 'data-processed'].includes(attr.name) || shouldPreserve) {
                        firstRoot.setAttribute(attr.name, attr.value);
                    }
                });
            }
            const parent = element.parentElement;
            if (!parent || !document.contains(element)) {
                return;
            }
            // Replace the placeholder element with the component content
            const fragment = document.createDocumentFragment();
            topLevelElements.forEach(el => fragment.appendChild(el));
            parent.replaceChild(fragment, element);
        },
        initialize() {
        }
    }; 

    (function () {
        let componentInstanceCounters = {};
        const swappedInstances = new Set();
        const instanceRouteMap = new Map();
        const placeholderMap = new Map();

        function getComponentInstanceId(name) {
            if (!componentInstanceCounters[name]) componentInstanceCounters[name] = 1;
            else componentInstanceCounters[name]++;
            return `${name}-${componentInstanceCounters[name]}`;
        }

        function logSiblings(parent, context) {
            if (!parent) return;
            Array.from(parent.children).map(el => `${el.tagName}[data-component=${el.getAttribute('data-component') || ''}]`).join(', ');
        }

        window.InduxComponentsSwapping = {
            // Swap in source code for a placeholder
            async swapIn(placeholder) {
                if (placeholder.hasAttribute('data-swapped')) return;
                const processor = window.InduxComponentsProcessor;
                if (!processor) return;
                const name = placeholder.tagName.toLowerCase().replace('x-', '');
                let instanceId = placeholder.getAttribute('data-component');
                if (!instanceId) {
                    instanceId = getComponentInstanceId(name);
                    placeholder.setAttribute('data-component', instanceId);
                }
                // Save placeholder for reversion in the map
                if (!placeholderMap.has(instanceId)) {
                    const clone = placeholder.cloneNode(true);
                    clone.setAttribute('data-original-placeholder', '');
                    clone.setAttribute('data-component', instanceId);
                    placeholderMap.set(instanceId, clone);
                }
                // Log before swap
                logSiblings(placeholder.parentNode);
                // Process and swap in source code, passing instanceId
                await processor.processComponent(placeholder, instanceId);
                swappedInstances.add(instanceId);
                // Track the route for this instance
                const xRoute = placeholder.getAttribute('x-route');
                instanceRouteMap.set(instanceId, xRoute);
                // Log after swap
                logSiblings(placeholder.parentNode || document.body);
            },
            // Revert to placeholder
            revert(instanceId) {
                if (!swappedInstances.has(instanceId)) return;
                // Remove all elements with data-component=instanceId
                const rendered = Array.from(document.querySelectorAll(`[data-component="${instanceId}"]`));
                if (rendered.length === 0) return;
                const first = rendered[0];
                const parent = first.parentNode;
                // Retrieve the original placeholder from the map
                const placeholder = placeholderMap.get(instanceId);
                // Log before revert
                logSiblings(parent);
                // Remove all rendered elements
                rendered.forEach(el => {
                    el.remove();
                });
                // Restore the placeholder at the correct position if not present
                if (placeholder && parent && !parent.contains(placeholder)) {
                    const targetPosition = parseInt(placeholder.getAttribute('data-order')) || 0;
                    let inserted = false;

                    // Find the correct position based on data-order
                    for (let i = 0; i < parent.children.length; i++) {
                        const child = parent.children[i];
                        const childPosition = parseInt(child.getAttribute('data-order')) || 0;

                        if (targetPosition < childPosition) {
                            parent.insertBefore(placeholder, child);
                            inserted = true;
                            break;
                        }
                    }

                    // If not inserted (should be at the end), append to parent
                    if (!inserted) {
                        parent.appendChild(placeholder);
                    }

                }
                swappedInstances.delete(instanceId);
                instanceRouteMap.delete(instanceId);
                placeholderMap.delete(instanceId);
                // Log after revert
                logSiblings(parent);
            },
            // Main swapping logic
            async processAll() {
                componentInstanceCounters = {};
                const registry = window.InduxComponentsRegistry;
                if (!registry) return;
                const routing = window.InduxRouting;
                const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
                    el.tagName.toLowerCase().startsWith('x-') &&
                    !el.hasAttribute('data-pre-rendered') &&
                    !el.hasAttribute('data-processed')
                );
                // First pass: revert any swapped-in instances that no longer match
                if (routing) {
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                    for (const instanceId of Array.from(swappedInstances)) {
                        const xRoute = instanceRouteMap.get(instanceId);
                        const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                        if (!matches) {
                            this.revert(instanceId);
                        }
                    }
                }
                // Second pass: swap in any placeholders that match
                for (const placeholder of placeholders) {
                    const name = placeholder.tagName.toLowerCase().replace('x-', '');
                    let instanceId = placeholder.getAttribute('data-component');
                    if (!instanceId) {
                        instanceId = getComponentInstanceId(name);
                        placeholder.setAttribute('data-component', instanceId);
                    }
                    const xRoute = placeholder.getAttribute('x-route');
                    if (!routing) {
                        // No routing: always swap in
                        await this.swapIn(placeholder);
                    } else {
                        // Routing present: check route
                        const currentPath = window.location.pathname;
                        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                        const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                        if (matches) {
                            await this.swapIn(placeholder);
                        }
                    }
                }
            },
            initialize() {
                // On init, process all
                this.processAll().then(() => {
                    // Dispatch event when components are fully processed
                    window.dispatchEvent(new CustomEvent('indux:components-processed'));
                });
                // If routing is present, listen for route changes
                if (window.InduxRouting) {
                    window.addEventListener('indux:route-change', () => {
                        this.processAll().then(() => {
                            // Dispatch event when components are fully processed after route change
                            window.dispatchEvent(new CustomEvent('indux:components-processed'));
                        });
                    });
                }
            }
        };
    })(); 

    window.InduxComponentsMutation = {
        async processAllPlaceholders() {
            const processor = window.InduxComponentsProcessor;
            const routing = window.InduxRouting;
            if (!processor) return;
            const placeholders = Array.from(document.querySelectorAll('*')).filter(el =>
                el.tagName.toLowerCase().startsWith('x-') &&
                !el.hasAttribute('data-pre-rendered') &&
                !el.hasAttribute('data-processed')
            );
            for (const el of placeholders) {
                if (routing) {
                    // Only process if route matches
                    const xRoute = el.getAttribute('x-route');
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                    const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                    if (!matches) continue;
                }
                await processor.processComponent(el);
            }
        },
        initialize() {
            const processor = window.InduxComponentsProcessor;
            const routing = window.InduxRouting;
            if (!processor) return;
            // Initial scan
            this.processAllPlaceholders();
            // Mutation observer for new placeholders
            const observer = new MutationObserver(async mutations => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.tagName.toLowerCase().startsWith('x-')) {
                            if (!node.hasAttribute('data-pre-rendered') && !node.hasAttribute('data-processed')) {
                                if (routing) {
                                    const xRoute = node.getAttribute('x-route');
                                    const currentPath = window.location.pathname;
                                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                                    const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                                    if (!matches) continue;
                                }
                                await processor.processComponent(node);
                            }
                        }
                        // Also check for any <x-*> descendants
                        if (node.nodeType === 1) {
                            const descendants = Array.from(node.querySelectorAll('*')).filter(el =>
                                el.tagName.toLowerCase().startsWith('x-') &&
                                !el.hasAttribute('data-pre-rendered') &&
                                !el.hasAttribute('data-processed')
                            );
                            for (const el of descendants) {
                                if (routing) {
                                    const xRoute = el.getAttribute('x-route');
                                    const currentPath = window.location.pathname;
                                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/+|\/+$/g, '');
                                    const matches = !xRoute || window.InduxRouting.matchesCondition(normalizedPath, xRoute);
                                    if (!matches) continue;
                                }
                                await processor.processComponent(el);
                            }
                        }
                    }
                }
            });

            // Ensure document.body exists before observing
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            } else {
                // Wait for body to be available
                document.addEventListener('DOMContentLoaded', () => {
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            }
        }
    }; 


    // Main initialization for Indux Components
    function initializeComponents() {
        if (window.InduxComponentsRegistry) window.InduxComponentsRegistry.initialize();
        if (window.InduxComponentsLoader) window.InduxComponentsLoader.initialize();
        if (window.InduxComponentsProcessor) window.InduxComponentsProcessor.initialize();
        if (window.InduxComponentsSwapping) window.InduxComponentsSwapping.initialize();
        if (window.InduxComponentsMutation) window.InduxComponentsMutation.initialize();
        if (window.InduxComponentsUtils) window.InduxComponentsUtils.initialize?.();
        window.__induxComponentsInitialized = true;
        window.dispatchEvent(new CustomEvent('indux:components-ready'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeComponents);
    } else {
        initializeComponents();
    }

    window.InduxComponents = {
        initialize: initializeComponents
    };

    /*! Indux Anchors 1.0.0 - MIT License */

    // Initialize plugin when Alpine is ready
    function initializeAnchorsPlugin() {
        // Register anchors directive
        Alpine.directive('anchors', (el, { expression, modifiers }, { effect, evaluateLater }) => {
            const getTarget = evaluateLater(expression || 'null');

            effect(() => {
                getTarget(async (target) => {
                    const extractHeadings = () => {
                        let headings = [];

                        if (target) {
                            // If target is a string, treat as selector
                            if (typeof target === 'string') {
                                const targetEl = document.querySelector(target);
                                if (targetEl) {
                                    const headingElements = targetEl.querySelectorAll('h1, h2, h3');
                                    headings = Array.from(headingElements).map((heading, index) => {
                                        // Generate ID if missing
                                        let id = heading.id;
                                        if (!id || id.trim() === '') {
                                            // Create ID from text content
                                            id = heading.textContent
                                                .toLowerCase()
                                                .replace(/[^a-z0-9\s-]/g, '')
                                                .replace(/\s+/g, '-')
                                                .trim();

                                            // Ensure uniqueness by adding index if needed
                                            if (!id) {
                                                id = `heading-${index}`;
                                            }

                                            // Set the ID on the heading element
                                            heading.id = id;
                                        }

                                        return {
                                            id: id,
                                            text: heading.textContent,
                                            level: parseInt(heading.tagName.charAt(1)),
                                            index: index // Add index for unique key
                                        };
                                    });
                                }
                            }
                            // If target is a DOM element, extract headings from it
                            else if (target && target.querySelectorAll) {
                                const headingElements = target.querySelectorAll('h1, h2, h3');
                                headings = Array.from(headingElements).map((heading, index) => {
                                    // Generate ID if missing
                                    let id = heading.id;
                                    if (!id || id.trim() === '') {
                                        // Create ID from text content
                                        id = heading.textContent
                                            .toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-')
                                            .trim();

                                        // Ensure uniqueness by adding index if needed
                                        if (!id) {
                                            id = `heading-${index}`;
                                        }

                                        // Set the ID on the heading element
                                        heading.id = id;
                                    }

                                    return {
                                        id: id,
                                        text: heading.textContent,
                                        level: parseInt(heading.tagName.charAt(1)),
                                        index: index // Add index for unique key
                                    };
                                });
                            }
                        }

                        return headings;
                    };

                    const updateHeadings = (headings) => {
                        // Find the closest Alpine component
                        const parentElement = el.closest('[x-data]') || document.body;

                        // Initialize anchorHeadings if it doesn't exist
                        if (parentElement._x_dataStack && parentElement._x_dataStack[0]) {
                            if (!parentElement._x_dataStack[0].anchorHeadings) {
                                parentElement._x_dataStack[0].anchorHeadings = [];
                            }
                            parentElement._x_dataStack[0].anchorHeadings = headings;
                        } else {
                            // Create data stack if it doesn't exist
                            if (!parentElement._x_dataStack) {
                                parentElement._x_dataStack = [{}];
                            }
                            parentElement._x_dataStack[0].anchorHeadings = headings;

                            // Initialize Alpine if needed
                            if (window.Alpine) {
                                Alpine.nextTick(() => {
                                    Alpine.initTree(parentElement);
                                });
                            }
                        }
                    };

                    // Try immediately
                    let headings = extractHeadings();

                    // If no headings found, set up a MutationObserver
                    if (headings.length === 0) {
                        if (typeof target === 'string') {
                            const targetEl = document.querySelector(target);
                            if (targetEl) {
                                const observer = new MutationObserver((mutations) => {
                                    const newHeadings = extractHeadings();
                                    if (newHeadings.length > 0) {
                                        updateHeadings(newHeadings);
                                        observer.disconnect();
                                    }
                                });

                                observer.observe(targetEl, {
                                    childList: true,
                                    subtree: true
                                });

                                // Also try a few times with setTimeout as fallback
                                let attempts = 0;
                                const tryAgain = () => {
                                    attempts++;
                                    const newHeadings = extractHeadings();
                                    if (newHeadings.length > 0) {
                                        updateHeadings(newHeadings);
                                        observer.disconnect();
                                    } else if (attempts < 10) {
                                        setTimeout(tryAgain, 200);
                                    } else {
                                        observer.disconnect();
                                    }
                                };
                                setTimeout(tryAgain, 200);
                            }
                        }
                    }

                    updateHeadings(headings);
                });
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeAnchorsPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeAnchorsPlugin);

    /*! Indux Carousels 1.0.0 - MIT License */

    function initializeCarouselPlugin() {

        Alpine.directive('carousel', (el, { value, modifiers, expression }, { evaluate, effect }) => {
            const state = {
                carousel: {
                    autoplay: modifiers.includes('autoplay'),
                    interval: 3000,
                    loop: modifiers.includes('loop'),
                    arrows: modifiers.includes('arrows'),
                    dots: modifiers.includes('dots'),
                    thumbnails: modifiers.includes('thumbnails'),
                    enableDrag: !modifiers.includes('no-drag')
                },
                currentSlide: 0,
                dragging: false,
                startX: 0,

                // Get total slides by counting actual DOM elements
                get totalSlides() {
                    const track = el.querySelector('.carousel-slides');
                    if (!track) return 0;
                    return Array.from(track.children).filter(child =>
                        child.tagName !== 'TEMPLATE'
                    ).length;
                },

                // Navigation methods
                next() {
                    const total = this.totalSlides;
                    if (this.currentSlide >= total - 1) {
                        if (this.carousel.loop) {
                            this.currentSlide = 0;
                        }
                    } else {
                        this.currentSlide++;
                    }
                },

                prev() {
                    const total = this.totalSlides;
                    if (this.currentSlide <= 0) {
                        if (this.carousel.loop) {
                            this.currentSlide = total - 1;
                        }
                    } else {
                        this.currentSlide--;
                    }
                },

                goToSlide(index) {
                    const total = this.totalSlides;
                    if (index >= 0 && index < total) {
                        this.currentSlide = index;
                    }
                },

                // Drag handlers
                startDrag(e) {
                    if (!this.carousel.enableDrag) return;
                    this.dragging = true;
                    this.startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
                },

                drag(e) {
                    if (!this.dragging) return;
                    e.preventDefault();
                    const currentX = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
                    const diff = currentX - this.startX;

                    if (Math.abs(diff) > 50) {
                        if (diff > 0) {
                            this.prev();
                        } else {
                            this.next();
                        }
                        this.dragging = false;
                    }
                },

                endDrag() {
                    this.dragging = false;
                },

                // Add this method to generate dots array
                get dots() {
                    return Array.from({ length: this.totalSlides }, (_, i) => ({
                        index: i,
                        active: i === this.currentSlide
                    }));
                }
            };

            Alpine.bind(el, {
                'x-data'() {
                    return state;
                },

                'x-init'() {
                    setTimeout(() => {
                        const track = el.querySelector('.carousel-slides');
                        if (!track) {
                            console.warn('[Indux] Carousel track element not found. Expected element with class "carousel-slides"');
                            return;
                        }

                        // Setup autoplay if enabled
                        if (this.carousel.autoplay) {
                            let interval;

                            const startAutoplay = () => {
                                interval = setInterval(() => this.next(), this.carousel.interval);
                            };

                            const stopAutoplay = () => {
                                clearInterval(interval);
                            };

                            // Start autoplay
                            startAutoplay();

                            // Pause on hover if autoplay is enabled
                            el.addEventListener('mouseenter', stopAutoplay);
                            el.addEventListener('mouseleave', startAutoplay);

                            // Clean up on element removal
                            el._x_cleanups = el._x_cleanups || [];
                            el._x_cleanups.push(() => {
                                stopAutoplay();
                                el.removeEventListener('mouseenter', stopAutoplay);
                                el.removeEventListener('mouseleave', startAutoplay);
                            });
                        }
                    }, 0);
                }
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeCarouselPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeCarouselPlugin);

    /*! Indux Code 1.0.0 - MIT License */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeCodePlugin() {
        // Check if CSS Custom Highlight API is supported
        if (!CSS.highlights) {
            console.warn('[Indux] CSS Custom Highlight API is not supported in this browser. Code highlighting will be disabled.');
            return;
        }

        // Configuration object for the code plugin
        const config = {
            // CDN base URL for Prism.js
            prismCDN: 'https://cdn.jsdelivr.net/npm/prismjs@1.30.0',
            // Flourite CDN for auto-detection
            flouriteCDN: 'https://cdn.jsdelivr.net/npm/flourite@1.3.0/dist/index.iife.js',
            // Custom language tokens (can be extended)
            languageTokens: {},
            // Theme configuration
            theme: 'prettylights',
            // Auto-detection settings
            autoDetect: true,
            // Fallback language if detection fails
            fallbackLanguage: 'text'
        };

        // Language mapping from Flourite to Prism.js
        const flouriteToPrism = {
            'C': 'c',
            'C++': 'cpp', 
            'C#': 'csharp',
            'Clojure': 'clojure',
            'CSS': 'css',
            'Dockerfile': 'docker',
            'Elixir': 'elixir',
            'Go': 'go',
            'HTML': 'markup',
            'Java': 'java',
            'Javascript': 'clike',
            'Julia': 'julia',
            'Kotlin': 'kotlin',
            'Lua': 'lua',
            'Markdown': 'markdown',
            'Pascal': 'pascal',
            'PHP': 'php',
            'Python': 'python',
            'Ruby': 'ruby',
            'Rust': 'rust',
            'SQL': 'sql',
            'Typescript': 'typescript',
            'YAML': 'yaml'
        };

        // Language aliases mapping for Prism.js
        const languageAliases = {
            html: 'markup',
            javascript: 'clike',
            actionscript: 'javascript',
            arduino: 'cpp',
            aspnet: ['markup', 'csharp'],
            bison: 'c',
            c: 'clike',
            csharp: 'clike',
            cpp: 'c',
            coffeescript: 'javascript',
            crystal: 'ruby',
            'css-extras': 'css',
            d: 'clike',
            dart: 'clike',
            django: 'markup',
            erb: ['ruby', 'markup-templating'],
            fsharp: 'clike',
            flow: 'javascript',
            glsl: 'clike',
            go: 'clike',
            groovy: 'clike',
            haml: 'ruby',
            handlebars: 'markup-templating',
            haxe: 'clike',
            java: 'clike',
            jolie: 'clike',
            kotlin: 'clike',
            less: 'css',
            markdown: 'markup',
            'markup-templating': 'markup',
            n4js: 'javascript',
            nginx: 'clike',
            objectivec: 'c',
            opencl: 'cpp',
            parser: 'markup',
            php: ['clike', 'markup-templating'],
            'php-extras': 'php',
            plsql: 'sql',
            processing: 'clike',
            protobuf: 'clike',
            pug: 'javascript',
            qore: 'clike',
            jsx: ['markup', 'javascript'],
            tsx: ['jsx', 'typescript'],
            reason: 'clike',
            ruby: 'clike',
            sass: 'css',
            scss: 'css',
            scala: 'java',
            smarty: 'markup-templating',
            soy: 'markup-templating',
            swift: 'clike',
            tap: 'yaml',
            textile: 'markup',
            tt2: ['clike', 'markup-templating'],
            twig: 'markup',
            typescript: 'javascript',
            vbnet: 'basic',
            velocity: 'markup',
            wiki: 'markup',
            xeora: 'markup',
            xquery: 'markup'
        };

        // Set of loaded languages to avoid duplicates
        const loadedLanguages = new Set();

        // Standard token types for CSS highlights
        const standardTokens = [
            'atrule', 'attr-name', 'attr-value', 'bold', 'boolean', 'builtin',
            'cdata', 'char', 'class-name', 'comment', 'constant', 'deleted',
            'doctype', 'entity', 'function', 'important', 'inserted', 'italic',
            'keyword', 'namespace', 'number', 'operator', 'prolog', 'property',
            'punctuation', 'regex', 'rule', 'selector', 'string', 'symbol',
            'tag', 'url'
        ];

        // Initialize CSS highlights
        function initializeHighlights() {
            const allTokens = [
                ...standardTokens,
                ...Object.entries(config.languageTokens).flatMap(([lang, tokens]) => {
                    return tokens.map(token => `${lang}-${token}`);
                })
            ];

            for (const token of allTokens) {
                CSS.highlights.set(token, new Highlight());
            }
        }

        // Load Flourite for auto-detection
        async function loadFlourite() {
            if (window.flourite) return window.flourite;
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = config.flouriteCDN;
                script.onload = () => {
                    resolve(window.flourite);
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // Auto-detect language using Flourite
        async function detectLanguage(code) {
            try {
                const flourite = await loadFlourite();
                const result = flourite(code, { shiki: true });
                
                // Map Flourite result to Prism.js language
                const prismLanguage = flouriteToPrism[result.language] || config.fallbackLanguage;
                
                console.log(`[Indux] Auto-detected language: ${result.language} → ${prismLanguage}`);
                return prismLanguage;
            } catch (error) {
                console.warn('[Indux] Language detection failed:', error);
                return config.fallbackLanguage;
            }
        }

        // Load Prism.js core
        function loadPrismCore() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = `${config.prismCDN}/components/prism-core.min.js`;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // Load language components
        async function loadLanguages(languages) {
            const languagesToLoad = (Array.isArray(languages) ? languages : [languages])
                .reduce((acc, lang) => {
                    // Resolve language aliases first
                    const resolvedLang = languageAliases[lang] || lang;
                    const deps = Array.isArray(resolvedLang) ? resolvedLang : [resolvedLang];
                    return acc.push(...deps), acc;
                }, []);

            for (const lang of languagesToLoad) {
                if (loadedLanguages.has(lang)) continue;

                // Load from CDN - this allows any language to be loaded dynamically
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = `${config.prismCDN}/components/prism-${lang}.min.js`;
                    script.onload = () => {
                        document.head.removeChild(script);
                        loadedLanguages.add(lang);
                        resolve(lang);
                    };
                    script.onerror = (error) => {
                        document.head.removeChild(script);
                        reject(error);
                    };
                    document.head.appendChild(script);
                });
            }

            return loadedLanguages;
        }

        // Tokenize code using Prism.js
        function tokenizeCode(code, language) {
            const grammar = window.Prism.languages[language];
            if (!grammar) {
                console.warn(`[Indux] No grammar found for language: ${language}`);
                return [];
            }
            return window.Prism.tokenize(code, grammar).flatMap(flattenTokens);
        }

        // Flatten nested tokens
        function flattenTokens(token) {
            if (typeof token?.content === 'string') {
                return token;
            } else if (Array.isArray(token.content)) {
                return token.content.flatMap(t =>
                    typeof t === 'string'
                        ? { type: token.type, content: t, length: t.length }
                        : t
                ).flatMap(flattenTokens);
            } else {
                return token;
            }
        }

        // X-Code custom element
        class XCodeElement extends HTMLElement {
            constructor() {
                super();
                this.highlights = new Set();
            }

            static get observedAttributes() {
                return ['language', 'theme', 'numbers', 'title'];
            }

            get language() {
                return this.getAttribute('language') || 'auto';
            }

            get theme() {
                return this.getAttribute('theme') || 'default';
            }

            get numbers() {
                return this.hasAttribute('numbers');
            }

            get title() {
                return this.getAttribute('name') || this.getAttribute('title');
            }

            get contentElement() {
                return this.querySelector('code') || this;
            }

            connectedCallback() {
                this.setupElement();
                this.setAttribute('tabindex', '0');
                this.loadLanguageAndHighlight();
            }

            attributeChangedCallback(name, oldValue, newValue) {
                if (oldValue !== newValue) {
                    if (name === 'language') {
                        this.loadLanguageAndHighlight();
                    } else if (name === 'theme') {
                        this.updateTheme();
                    } else if (name === 'numbers') {
                        this.updateLineNumbers();
                    } else if (name === 'title') {
                        this.updateTitle();
                    }
                }
            }

            setupElement() {
                // Create semantically correct structure: pre > code
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                
                // Get the text content and remove HTML indentation
                let content = this.textContent.trim();
                
                // Split into lines and remove common leading whitespace
                const lines = content.split('\n');
                
                if (lines.length > 1) {
                    // Find the minimum indentation (excluding empty lines and lines with no indentation)
                    let minIndent = Infinity;
                    for (const line of lines) {
                        if (line.trim() !== '') {
                            const indent = line.length - line.trimStart().length;
                            if (indent > 0) { // Only consider lines that actually have indentation
                                minIndent = Math.min(minIndent, indent);
                            }
                        }
                    }

                    // Remove the common indentation from all lines
                    if (minIndent < Infinity) {
                        content = lines.map(line => {
                            if (line.trim() === '') return '';
                            const indent = line.length - line.trimStart().length;
                            // Only remove indentation if the line has enough spaces
                            return indent >= minIndent ? line.slice(minIndent) : line;
                        }).join('\n');
                    }
                }
                
                code.textContent = content;
                pre.appendChild(code);
                this.textContent = '';
                this.appendChild(pre);

                // Create title if present (after pre element is created)
                if (this.title) {
                    const header = document.createElement('div');
                    header.className = 'header';
                    
                    const title = document.createElement('div');
                    title.className = 'code-title';
                    title.textContent = this.title;
                    header.appendChild(title);
                    
                    this.insertBefore(header, pre);
                }

                // Add line numbers if enabled
                if (this.numbers) {
                    this.setupLineNumbers();
                }
            }

            async setupLineNumbers() {
                try {
                    // Ensure the pre element exists and has content
                    const pre = this.querySelector('pre');

                    if (pre && !this.querySelector('.lines')) {
                        // Make sure the pre element is properly set up first
                        if (!pre.querySelector('code')) {
                            const code = document.createElement('code');
                            code.textContent = pre.textContent;
                            pre.textContent = '';
                            pre.appendChild(code);
                        }

                        // Create line numbers manually for better control

                        // Count the lines using the actual DOM content
                        const codeText = pre.textContent;
                        const lines = codeText.split('\n');

                        // Create the lines list
                        const linesList = document.createElement('ul');
                        linesList.className = 'lines';

                        // Add line number items for all lines (including empty ones)
                        for (let i = 0; i < lines.length; i++) {
                            const li = document.createElement('li');
                            // Show line numbers for all lines to match the actual DOM structure
                            li.textContent = (i + 1).toString();
                            linesList.appendChild(li);
                        }

                        // Insert line numbers before the pre element
                        this.insertBefore(linesList, pre);

                    }
                } catch (error) {
                    console.warn('[Indux] Failed to setup line numbers:', error);
                }
            }

            updateLineNumbers() {
                if (this.numbers) {
                    this.setupLineNumbers();
                } else {
                    // Remove line numbers if disabled
                    const lines = this.querySelector('.lines');
                    if (lines) {
                        lines.remove();
                    }
                }
            }

            async loadLanguageAndHighlight() {
                try {
                    let language = this.language;
                    
                    // Auto-detect language if not specified or set to 'auto'
                    if (language === 'auto' || !language) {
                        const code = this.contentElement.textContent;
                        language = await detectLanguage(code);
                        this.setAttribute('language', language);
                    }
                    
                    await loadLanguages(language);
                    this.paintTokenHighlights();
                } catch (error) {
                    console.warn(`[Indux] Failed to load language: ${this.language}`, error);
                    // Fallback to plain text if language loading fails
                    this.setAttribute('language', 'text');
                }
            }

            paintTokenHighlights() {
                // Resolve the actual language name for tokenization
                const resolvedLanguage = languageAliases[this.language] || this.language;
                const tokens = tokenizeCode(this.contentElement.textContent, resolvedLanguage);
                const customTokens = config.languageTokens[this.language] || [];
                let position = 0;

                for (const token of tokens) {
                    if (token.type) {
                        const tokenType = customTokens.includes(token.type)
                            ? `${this.language}-${token.type}`
                            : token.type;

                        const range = new Range();
                        range.setStart(this.contentElement.firstChild, position);
                        range.setEnd(this.contentElement.firstChild, position + token.length);

                        const highlight = CSS.highlights.get(tokenType);

                        if (highlight) {
                            highlight.add(range);
                            this.highlights.add({ tokenType, range });
                        }
                    }
                    position += token.length;
                }
            }

            clearTokenHighlights() {
                for (const highlight of this.highlights) {
                    const cssHighlight = CSS.highlights.get(highlight.tokenType);
                    if (cssHighlight) {
                        cssHighlight.delete(highlight.range);
                    }
                }
                this.highlights.clear();
            }

            update() {
                this.clearTokenHighlights();
                this.paintTokenHighlights();
            }

            updateTheme() {
                // Theme switching logic could be implemented here
                // For now, we'll rely on CSS custom properties
            }

            updateTitle() {
                let titleElement = this.querySelector('.code-title');
                if (this.title) {
                    if (!titleElement) {
                        titleElement = document.createElement('div');
                        titleElement.className = 'code-title';
                        this.insertBefore(titleElement, this.firstChild);
                    }
                    titleElement.textContent = this.title;
                } else if (titleElement) {
                    titleElement.remove();
                }
            }
        }

        // Initialize the plugin
        async function initialize() {
            try {
                initializeHighlights();
                await loadPrismCore();

                // Register the custom element
                if (!customElements.get('x-code')) {
                    customElements.define('x-code', XCodeElement);
                }

            } catch (error) {
                console.error('[Indux] Failed to initialize code plugin:', error);
            }
        }

        // Alpine.js directive for code highlighting (only if Alpine is available)
        if (typeof Alpine !== 'undefined') {
            Alpine.directive('code', (el, { expression, modifiers }, { effect, evaluateLater }) => {
                // Create x-code element
                const codeElement = document.createElement('x-code');

                // Get language from various possible sources
                let language = 'auto';
                
                // Check for language attribute first
                const languageAttr = el.getAttribute('language');
                if (languageAttr) {
                    language = languageAttr;
                } else if (expression && typeof expression === 'string' && !expression.includes('.')) {
                    // Fallback to expression if it's a simple string
                    language = expression;
                } else if (modifiers.length > 0) {
                    // Fallback to first modifier
                    language = modifiers[0];
                }

                codeElement.setAttribute('language', language);

                // Set theme if specified
                if (modifiers.includes('dark') || el.hasAttribute('dark')) {
                    codeElement.setAttribute('theme', 'dark');
                }

                // Enable line numbers if specified
                if (modifiers.includes('numbers') || modifiers.includes('line-numbers') || el.hasAttribute('numbers')) {
                    codeElement.setAttribute('numbers', '');
                }

                // Set title from various possible sources
                const title = el.getAttribute('name') || el.getAttribute('title') || el.getAttribute('data-title');
                if (title) {
                    codeElement.setAttribute('title', title);
                }

                // Move content to x-code element
                const content = el.textContent.trim();
                codeElement.textContent = content;
                el.textContent = '';
                el.appendChild(codeElement);

                // Handle dynamic content updates only if expression is a variable
                if (expression && (expression.includes('.') || !['javascript', 'css', 'html', 'python', 'ruby', 'php', 'java', 'c', 'cpp', 'csharp', 'go', 'sql', 'json', 'yaml', 'markdown', 'typescript', 'jsx', 'tsx', 'scss', 'sass', 'less', 'xml', 'markup'].includes(expression))) {
                    const getContent = evaluateLater(expression);
                    effect(() => {
                        getContent((content) => {
                            if (content && typeof content === 'string') {
                                codeElement.textContent = content;
                                codeElement.update();
                            }
                        });
                    });
                }
            });
        }

        // Handle both DOMContentLoaded and alpine:init
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            initialize();
        }

        // Listen for Alpine initialization (only if Alpine is available)
        if (typeof Alpine !== 'undefined') {
            document.addEventListener('alpine:init', initialize);
        } else {
            // If Alpine isn't available yet, listen for it to become available
            document.addEventListener('alpine:init', () => {
                // Re-register the directive when Alpine becomes available
                if (typeof Alpine !== 'undefined') {
                    Alpine.directive('code', (el, { expression, modifiers }, { effect, evaluateLater }) => {
                        // Create x-code element
                        const codeElement = document.createElement('x-code');

                        // Get language from various possible sources
                        let language = 'auto';
                        
                        // Check for language attribute first
                        const languageAttr = el.getAttribute('language');
                        if (languageAttr) {
                            language = languageAttr;
                        } else if (expression && typeof expression === 'string' && !expression.includes('.')) {
                            // Fallback to expression if it's a simple string
                            language = expression;
                        } else if (modifiers.length > 0) {
                            // Fallback to first modifier
                            language = modifiers[0];
                        }

                        codeElement.setAttribute('language', language);

                        // Set theme if specified
                        if (modifiers.includes('dark') || el.hasAttribute('dark')) {
                            codeElement.setAttribute('theme', 'dark');
                        }

                        // Enable line numbers if specified
                        if (modifiers.includes('numbers') || modifiers.includes('line-numbers') || el.hasAttribute('numbers')) {
                            codeElement.setAttribute('numbers', '');
                        }

                        // Set title from various possible sources
                        const title = el.getAttribute('name') || el.getAttribute('title') || el.getAttribute('data-title');
                        if (title) {
                            codeElement.setAttribute('title', title);
                        }

                        // Move content to x-code element
                        const content = el.textContent.trim();
                        codeElement.textContent = content;
                        el.textContent = '';
                        el.appendChild(codeElement);

                        // Handle dynamic content updates only if expression is a variable
                        if (expression && (expression.includes('.') || !['javascript', 'css', 'html', 'python', 'ruby', 'php', 'java', 'c', 'cpp', 'csharp', 'go', 'sql', 'json', 'yaml', 'markdown', 'typescript', 'jsx', 'tsx', 'scss', 'sass', 'less', 'xml', 'markup'].includes(expression))) {
                            const getContent = evaluateLater(expression);
                            effect(() => {
                                getContent((content) => {
                                    if (content && typeof content === 'string') {
                                        codeElement.textContent = content;
                                        codeElement.update();
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    }

    // Initialize the plugin
    initializeCodePlugin();

    var indux_collections$1 = {exports: {}};

    /*! Indux Collections 1.0.0 - MIT License */
    var indux_collections = indux_collections$1.exports;

    var hasRequiredIndux_collections;

    function requireIndux_collections () {
    	if (hasRequiredIndux_collections) return indux_collections$1.exports;
    	hasRequiredIndux_collections = 1;
    	(function (module, exports) {
    		/*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
    		!function (e, t) { t(exports) ; }(indux_collections, (function (e) { function t(e) { return null == e } var n = { isNothing: t, isObject: function (e) { return "object" == typeof e && null !== e }, toArray: function (e) { return Array.isArray(e) ? e : t(e) ? [] : [e] }, repeat: function (e, t) { var n, i = ""; for (n = 0; n < t; n += 1)i += e; return i }, isNegativeZero: function (e) { return 0 === e && Number.NEGATIVE_INFINITY === 1 / e }, extend: function (e, t) { var n, i, r, o; if (t) for (n = 0, i = (o = Object.keys(t)).length; n < i; n += 1)e[r = o[n]] = t[r]; return e } }; function i(e, t) { var n = "", i = e.reason || "(unknown reason)"; return e.mark ? (e.mark.name && (n += 'in "' + e.mark.name + '" '), n += "(" + (e.mark.line + 1) + ":" + (e.mark.column + 1) + ")", !t && e.mark.snippet && (n += "\n\n" + e.mark.snippet), i + " " + n) : i } function r(e, t) { Error.call(this), this.name = "YAMLException", this.reason = e, this.mark = t, this.message = i(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = (new Error).stack || ""; } r.prototype = Object.create(Error.prototype), r.prototype.constructor = r, r.prototype.toString = function (e) { return this.name + ": " + i(this, e) }; var o = r; function a(e, t, n, i, r) { var o = "", a = "", l = Math.floor(r / 2) - 1; return i - t > l && (t = i - l + (o = " ... ").length), n - i > l && (n = i + l - (a = " ...").length), { str: o + e.slice(t, n).replace(/\t/g, "→") + a, pos: i - t + o.length } } function l(e, t) { return n.repeat(" ", t - e.length) + e } var c = function (e, t) { if (t = Object.create(t || null), !e.buffer) return null; t.maxLength || (t.maxLength = 79), "number" != typeof t.indent && (t.indent = 1), "number" != typeof t.linesBefore && (t.linesBefore = 3), "number" != typeof t.linesAfter && (t.linesAfter = 2); for (var i, r = /\r?\n|\r|\0/g, o = [0], c = [], s = -1; i = r.exec(e.buffer);)c.push(i.index), o.push(i.index + i[0].length), e.position <= i.index && s < 0 && (s = o.length - 2); s < 0 && (s = o.length - 1); var u, p, f = "", d = Math.min(e.line + t.linesAfter, c.length).toString().length, h = t.maxLength - (t.indent + d + 3); for (u = 1; u <= t.linesBefore && !(s - u < 0); u++)p = a(e.buffer, o[s - u], c[s - u], e.position - (o[s] - o[s - u]), h), f = n.repeat(" ", t.indent) + l((e.line - u + 1).toString(), d) + " | " + p.str + "\n" + f; for (p = a(e.buffer, o[s], c[s], e.position, h), f += n.repeat(" ", t.indent) + l((e.line + 1).toString(), d) + " | " + p.str + "\n", f += n.repeat("-", t.indent + d + 3 + p.pos) + "^\n", u = 1; u <= t.linesAfter && !(s + u >= c.length); u++)p = a(e.buffer, o[s + u], c[s + u], e.position - (o[s] - o[s + u]), h), f += n.repeat(" ", t.indent) + l((e.line + u + 1).toString(), d) + " | " + p.str + "\n"; return f.replace(/\n$/, "") }, s = ["kind", "multi", "resolve", "construct", "instanceOf", "predicate", "represent", "representName", "defaultStyle", "styleAliases"], u = ["scalar", "sequence", "mapping"]; var p = function (e, t) { if (t = t || {}, Object.keys(t).forEach((function (t) { if (-1 === s.indexOf(t)) throw new o('Unknown option "' + t + '" is met in definition of "' + e + '" YAML type.') })), this.options = t, this.tag = e, this.kind = t.kind || null, this.resolve = t.resolve || function () { return !0 }, this.construct = t.construct || function (e) { return e }, this.instanceOf = t.instanceOf || null, this.predicate = t.predicate || null, this.represent = t.represent || null, this.representName = t.representName || null, this.defaultStyle = t.defaultStyle || null, this.multi = t.multi || !1, this.styleAliases = function (e) { var t = {}; return null !== e && Object.keys(e).forEach((function (n) { e[n].forEach((function (e) { t[String(e)] = n; })); })), t }(t.styleAliases || null), -1 === u.indexOf(this.kind)) throw new o('Unknown kind "' + this.kind + '" is specified for "' + e + '" YAML type.') }; function f(e, t) { var n = []; return e[t].forEach((function (e) { var t = n.length; n.forEach((function (n, i) { n.tag === e.tag && n.kind === e.kind && n.multi === e.multi && (t = i); })), n[t] = e; })), n } function d(e) { return this.extend(e) } d.prototype.extend = function (e) { var t = [], n = []; if (e instanceof p) n.push(e); else if (Array.isArray(e)) n = n.concat(e); else { if (!e || !Array.isArray(e.implicit) && !Array.isArray(e.explicit)) throw new o("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })"); e.implicit && (t = t.concat(e.implicit)), e.explicit && (n = n.concat(e.explicit)); } t.forEach((function (e) { if (!(e instanceof p)) throw new o("Specified list of YAML types (or a single Type object) contains a non-Type object."); if (e.loadKind && "scalar" !== e.loadKind) throw new o("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported."); if (e.multi) throw new o("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.") })), n.forEach((function (e) { if (!(e instanceof p)) throw new o("Specified list of YAML types (or a single Type object) contains a non-Type object.") })); var i = Object.create(d.prototype); return i.implicit = (this.implicit || []).concat(t), i.explicit = (this.explicit || []).concat(n), i.compiledImplicit = f(i, "implicit"), i.compiledExplicit = f(i, "explicit"), i.compiledTypeMap = function () { var e, t, n = { scalar: {}, sequence: {}, mapping: {}, fallback: {}, multi: { scalar: [], sequence: [], mapping: [], fallback: [] } }; function i(e) { e.multi ? (n.multi[e.kind].push(e), n.multi.fallback.push(e)) : n[e.kind][e.tag] = n.fallback[e.tag] = e; } for (e = 0, t = arguments.length; e < t; e += 1)arguments[e].forEach(i); return n }(i.compiledImplicit, i.compiledExplicit), i }; var h = d, g = new p("tag:yaml.org,2002:str", { kind: "scalar", construct: function (e) { return null !== e ? e : "" } }), m = new p("tag:yaml.org,2002:seq", { kind: "sequence", construct: function (e) { return null !== e ? e : [] } }), y = new p("tag:yaml.org,2002:map", { kind: "mapping", construct: function (e) { return null !== e ? e : {} } }), b = new h({ explicit: [g, m, y] }); var A = new p("tag:yaml.org,2002:null", { kind: "scalar", resolve: function (e) { if (null === e) return !0; var t = e.length; return 1 === t && "~" === e || 4 === t && ("null" === e || "Null" === e || "NULL" === e) }, construct: function () { return null }, predicate: function (e) { return null === e }, represent: { canonical: function () { return "~" }, lowercase: function () { return "null" }, uppercase: function () { return "NULL" }, camelcase: function () { return "Null" }, empty: function () { return "" } }, defaultStyle: "lowercase" }); var v = new p("tag:yaml.org,2002:bool", { kind: "scalar", resolve: function (e) { if (null === e) return !1; var t = e.length; return 4 === t && ("true" === e || "True" === e || "TRUE" === e) || 5 === t && ("false" === e || "False" === e || "FALSE" === e) }, construct: function (e) { return "true" === e || "True" === e || "TRUE" === e }, predicate: function (e) { return "[object Boolean]" === Object.prototype.toString.call(e) }, represent: { lowercase: function (e) { return e ? "true" : "false" }, uppercase: function (e) { return e ? "TRUE" : "FALSE" }, camelcase: function (e) { return e ? "True" : "False" } }, defaultStyle: "lowercase" }); function w(e) { return 48 <= e && e <= 55 } function k(e) { return 48 <= e && e <= 57 } var C = new p("tag:yaml.org,2002:int", { kind: "scalar", resolve: function (e) { if (null === e) return !1; var t, n, i = e.length, r = 0, o = !1; if (!i) return !1; if ("-" !== (t = e[r]) && "+" !== t || (t = e[++r]), "0" === t) { if (r + 1 === i) return !0; if ("b" === (t = e[++r])) { for (r++; r < i; r++)if ("_" !== (t = e[r])) { if ("0" !== t && "1" !== t) return !1; o = !0; } return o && "_" !== t } if ("x" === t) { for (r++; r < i; r++)if ("_" !== (t = e[r])) { if (!(48 <= (n = e.charCodeAt(r)) && n <= 57 || 65 <= n && n <= 70 || 97 <= n && n <= 102)) return !1; o = !0; } return o && "_" !== t } if ("o" === t) { for (r++; r < i; r++)if ("_" !== (t = e[r])) { if (!w(e.charCodeAt(r))) return !1; o = !0; } return o && "_" !== t } } if ("_" === t) return !1; for (; r < i; r++)if ("_" !== (t = e[r])) { if (!k(e.charCodeAt(r))) return !1; o = !0; } return !(!o || "_" === t) }, construct: function (e) { var t, n = e, i = 1; if (-1 !== n.indexOf("_") && (n = n.replace(/_/g, "")), "-" !== (t = n[0]) && "+" !== t || ("-" === t && (i = -1), t = (n = n.slice(1))[0]), "0" === n) return 0; if ("0" === t) { if ("b" === n[1]) return i * parseInt(n.slice(2), 2); if ("x" === n[1]) return i * parseInt(n.slice(2), 16); if ("o" === n[1]) return i * parseInt(n.slice(2), 8) } return i * parseInt(n, 10) }, predicate: function (e) { return "[object Number]" === Object.prototype.toString.call(e) && e % 1 == 0 && !n.isNegativeZero(e) }, represent: { binary: function (e) { return e >= 0 ? "0b" + e.toString(2) : "-0b" + e.toString(2).slice(1) }, octal: function (e) { return e >= 0 ? "0o" + e.toString(8) : "-0o" + e.toString(8).slice(1) }, decimal: function (e) { return e.toString(10) }, hexadecimal: function (e) { return e >= 0 ? "0x" + e.toString(16).toUpperCase() : "-0x" + e.toString(16).toUpperCase().slice(1) } }, defaultStyle: "decimal", styleAliases: { binary: [2, "bin"], octal: [8, "oct"], decimal: [10, "dec"], hexadecimal: [16, "hex"] } }), x = new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"); var I = /^[-+]?[0-9]+e/; var S = new p("tag:yaml.org,2002:float", { kind: "scalar", resolve: function (e) { return null !== e && !(!x.test(e) || "_" === e[e.length - 1]) }, construct: function (e) { var t, n; return n = "-" === (t = e.replace(/_/g, "").toLowerCase())[0] ? -1 : 1, "+-".indexOf(t[0]) >= 0 && (t = t.slice(1)), ".inf" === t ? 1 === n ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : ".nan" === t ? NaN : n * parseFloat(t, 10) }, predicate: function (e) { return "[object Number]" === Object.prototype.toString.call(e) && (e % 1 != 0 || n.isNegativeZero(e)) }, represent: function (e, t) { var i; if (isNaN(e)) switch (t) { case "lowercase": return ".nan"; case "uppercase": return ".NAN"; case "camelcase": return ".NaN" } else if (Number.POSITIVE_INFINITY === e) switch (t) { case "lowercase": return ".inf"; case "uppercase": return ".INF"; case "camelcase": return ".Inf" } else if (Number.NEGATIVE_INFINITY === e) switch (t) { case "lowercase": return "-.inf"; case "uppercase": return "-.INF"; case "camelcase": return "-.Inf" } else if (n.isNegativeZero(e)) return "-0.0"; return i = e.toString(10), I.test(i) ? i.replace("e", ".e") : i }, defaultStyle: "lowercase" }), O = b.extend({ implicit: [A, v, C, S] }), j = O, T = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"), N = new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"); var F = new p("tag:yaml.org,2002:timestamp", { kind: "scalar", resolve: function (e) { return null !== e && (null !== T.exec(e) || null !== N.exec(e)) }, construct: function (e) { var t, n, i, r, o, a, l, c, s = 0, u = null; if (null === (t = T.exec(e)) && (t = N.exec(e)), null === t) throw new Error("Date resolve error"); if (n = +t[1], i = +t[2] - 1, r = +t[3], !t[4]) return new Date(Date.UTC(n, i, r)); if (o = +t[4], a = +t[5], l = +t[6], t[7]) { for (s = t[7].slice(0, 3); s.length < 3;)s += "0"; s = +s; } return t[9] && (u = 6e4 * (60 * +t[10] + +(t[11] || 0)), "-" === t[9] && (u = -u)), c = new Date(Date.UTC(n, i, r, o, a, l, s)), u && c.setTime(c.getTime() - u), c }, instanceOf: Date, represent: function (e) { return e.toISOString() } }); var E = new p("tag:yaml.org,2002:merge", { kind: "scalar", resolve: function (e) { return "<<" === e || null === e } }), M = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r"; var L = new p("tag:yaml.org,2002:binary", { kind: "scalar", resolve: function (e) { if (null === e) return !1; var t, n, i = 0, r = e.length, o = M; for (n = 0; n < r; n++)if (!((t = o.indexOf(e.charAt(n))) > 64)) { if (t < 0) return !1; i += 6; } return i % 8 == 0 }, construct: function (e) { var t, n, i = e.replace(/[\r\n=]/g, ""), r = i.length, o = M, a = 0, l = []; for (t = 0; t < r; t++)t % 4 == 0 && t && (l.push(a >> 16 & 255), l.push(a >> 8 & 255), l.push(255 & a)), a = a << 6 | o.indexOf(i.charAt(t)); return 0 === (n = r % 4 * 6) ? (l.push(a >> 16 & 255), l.push(a >> 8 & 255), l.push(255 & a)) : 18 === n ? (l.push(a >> 10 & 255), l.push(a >> 2 & 255)) : 12 === n && l.push(a >> 4 & 255), new Uint8Array(l) }, predicate: function (e) { return "[object Uint8Array]" === Object.prototype.toString.call(e) }, represent: function (e) { var t, n, i = "", r = 0, o = e.length, a = M; for (t = 0; t < o; t++)t % 3 == 0 && t && (i += a[r >> 18 & 63], i += a[r >> 12 & 63], i += a[r >> 6 & 63], i += a[63 & r]), r = (r << 8) + e[t]; return 0 === (n = o % 3) ? (i += a[r >> 18 & 63], i += a[r >> 12 & 63], i += a[r >> 6 & 63], i += a[63 & r]) : 2 === n ? (i += a[r >> 10 & 63], i += a[r >> 4 & 63], i += a[r << 2 & 63], i += a[64]) : 1 === n && (i += a[r >> 2 & 63], i += a[r << 4 & 63], i += a[64], i += a[64]), i } }), _ = Object.prototype.hasOwnProperty, D = Object.prototype.toString; var U = new p("tag:yaml.org,2002:omap", { kind: "sequence", resolve: function (e) { if (null === e) return !0; var t, n, i, r, o, a = [], l = e; for (t = 0, n = l.length; t < n; t += 1) { if (i = l[t], o = !1, "[object Object]" !== D.call(i)) return !1; for (r in i) if (_.call(i, r)) { if (o) return !1; o = !0; } if (!o) return !1; if (-1 !== a.indexOf(r)) return !1; a.push(r); } return !0 }, construct: function (e) { return null !== e ? e : [] } }), q = Object.prototype.toString; var Y = new p("tag:yaml.org,2002:pairs", { kind: "sequence", resolve: function (e) { if (null === e) return !0; var t, n, i, r, o, a = e; for (o = new Array(a.length), t = 0, n = a.length; t < n; t += 1) { if (i = a[t], "[object Object]" !== q.call(i)) return !1; if (1 !== (r = Object.keys(i)).length) return !1; o[t] = [r[0], i[r[0]]]; } return !0 }, construct: function (e) { if (null === e) return []; var t, n, i, r, o, a = e; for (o = new Array(a.length), t = 0, n = a.length; t < n; t += 1)i = a[t], r = Object.keys(i), o[t] = [r[0], i[r[0]]]; return o } }), R = Object.prototype.hasOwnProperty; var B = new p("tag:yaml.org,2002:set", { kind: "mapping", resolve: function (e) { if (null === e) return !0; var t, n = e; for (t in n) if (R.call(n, t) && null !== n[t]) return !1; return !0 }, construct: function (e) { return null !== e ? e : {} } }), K = j.extend({ implicit: [F, E], explicit: [L, U, Y, B] }), P = Object.prototype.hasOwnProperty, W = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, H = /[\x85\u2028\u2029]/, $ = /[,\[\]\{\}]/, G = /^(?:!|!!|![a-z\-]+!)$/i, V = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i; function Z(e) { return Object.prototype.toString.call(e) } function J(e) { return 10 === e || 13 === e } function Q(e) { return 9 === e || 32 === e } function z(e) { return 9 === e || 32 === e || 10 === e || 13 === e } function X(e) { return 44 === e || 91 === e || 93 === e || 123 === e || 125 === e } function ee(e) { var t; return 48 <= e && e <= 57 ? e - 48 : 97 <= (t = 32 | e) && t <= 102 ? t - 97 + 10 : -1 } function te(e) { return 48 === e ? "\0" : 97 === e ? "" : 98 === e ? "\b" : 116 === e || 9 === e ? "\t" : 110 === e ? "\n" : 118 === e ? "\v" : 102 === e ? "\f" : 114 === e ? "\r" : 101 === e ? "" : 32 === e ? " " : 34 === e ? '"' : 47 === e ? "/" : 92 === e ? "\\" : 78 === e ? "" : 95 === e ? " " : 76 === e ? "\u2028" : 80 === e ? "\u2029" : "" } function ne(e) { return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(55296 + (e - 65536 >> 10), 56320 + (e - 65536 & 1023)) } for (var ie = new Array(256), re = new Array(256), oe = 0; oe < 256; oe++)ie[oe] = te(oe) ? 1 : 0, re[oe] = te(oe); function ae(e, t) { this.input = e, this.filename = t.filename || null, this.schema = t.schema || K, this.onWarning = t.onWarning || null, this.legacy = t.legacy || !1, this.json = t.json || !1, this.listener = t.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = []; } function le(e, t) { var n = { name: e.filename, buffer: e.input.slice(0, -1), position: e.position, line: e.line, column: e.position - e.lineStart }; return n.snippet = c(n), new o(t, n) } function ce(e, t) { throw le(e, t) } function se(e, t) { e.onWarning && e.onWarning.call(null, le(e, t)); } var ue = { YAML: function (e, t, n) { var i, r, o; null !== e.version && ce(e, "duplication of %YAML directive"), 1 !== n.length && ce(e, "YAML directive accepts exactly one argument"), null === (i = /^([0-9]+)\.([0-9]+)$/.exec(n[0])) && ce(e, "ill-formed argument of the YAML directive"), r = parseInt(i[1], 10), o = parseInt(i[2], 10), 1 !== r && ce(e, "unacceptable YAML version of the document"), e.version = n[0], e.checkLineBreaks = o < 2, 1 !== o && 2 !== o && se(e, "unsupported YAML version of the document"); }, TAG: function (e, t, n) { var i, r; 2 !== n.length && ce(e, "TAG directive accepts exactly two arguments"), i = n[0], r = n[1], G.test(i) || ce(e, "ill-formed tag handle (first argument) of the TAG directive"), P.call(e.tagMap, i) && ce(e, 'there is a previously declared suffix for "' + i + '" tag handle'), V.test(r) || ce(e, "ill-formed tag prefix (second argument) of the TAG directive"); try { r = decodeURIComponent(r); } catch (t) { ce(e, "tag prefix is malformed: " + r); } e.tagMap[i] = r; } }; function pe(e, t, n, i) { var r, o, a, l; if (t < n) { if (l = e.input.slice(t, n), i) for (r = 0, o = l.length; r < o; r += 1)9 === (a = l.charCodeAt(r)) || 32 <= a && a <= 1114111 || ce(e, "expected valid JSON character"); else W.test(l) && ce(e, "the stream contains non-printable characters"); e.result += l; } } function fe(e, t, i, r) { var o, a, l, c; for (n.isObject(i) || ce(e, "cannot merge mappings; the provided source object is unacceptable"), l = 0, c = (o = Object.keys(i)).length; l < c; l += 1)a = o[l], P.call(t, a) || (t[a] = i[a], r[a] = !0); } function de(e, t, n, i, r, o, a, l, c) { var s, u; if (Array.isArray(r)) for (s = 0, u = (r = Array.prototype.slice.call(r)).length; s < u; s += 1)Array.isArray(r[s]) && ce(e, "nested arrays are not supported inside keys"), "object" == typeof r && "[object Object]" === Z(r[s]) && (r[s] = "[object Object]"); if ("object" == typeof r && "[object Object]" === Z(r) && (r = "[object Object]"), r = String(r), null === t && (t = {}), "tag:yaml.org,2002:merge" === i) if (Array.isArray(o)) for (s = 0, u = o.length; s < u; s += 1)fe(e, t, o[s], n); else fe(e, t, o, n); else e.json || P.call(n, r) || !P.call(t, r) || (e.line = a || e.line, e.lineStart = l || e.lineStart, e.position = c || e.position, ce(e, "duplicated mapping key")), "__proto__" === r ? Object.defineProperty(t, r, { configurable: !0, enumerable: !0, writable: !0, value: o }) : t[r] = o, delete n[r]; return t } function he(e) { var t; 10 === (t = e.input.charCodeAt(e.position)) ? e.position++ : 13 === t ? (e.position++, 10 === e.input.charCodeAt(e.position) && e.position++) : ce(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1; } function ge(e, t, n) { for (var i = 0, r = e.input.charCodeAt(e.position); 0 !== r;) { for (; Q(r);)9 === r && -1 === e.firstTabInLine && (e.firstTabInLine = e.position), r = e.input.charCodeAt(++e.position); if (t && 35 === r) do { r = e.input.charCodeAt(++e.position); } while (10 !== r && 13 !== r && 0 !== r); if (!J(r)) break; for (he(e), r = e.input.charCodeAt(e.position), i++, e.lineIndent = 0; 32 === r;)e.lineIndent++, r = e.input.charCodeAt(++e.position); } return -1 !== n && 0 !== i && e.lineIndent < n && se(e, "deficient indentation"), i } function me(e) { var t, n = e.position; return !(45 !== (t = e.input.charCodeAt(n)) && 46 !== t || t !== e.input.charCodeAt(n + 1) || t !== e.input.charCodeAt(n + 2) || (n += 3, 0 !== (t = e.input.charCodeAt(n)) && !z(t))) } function ye(e, t) { 1 === t ? e.result += " " : t > 1 && (e.result += n.repeat("\n", t - 1)); } function be(e, t) { var n, i, r = e.tag, o = e.anchor, a = [], l = !1; if (-1 !== e.firstTabInLine) return !1; for (null !== e.anchor && (e.anchorMap[e.anchor] = a), i = e.input.charCodeAt(e.position); 0 !== i && (-1 !== e.firstTabInLine && (e.position = e.firstTabInLine, ce(e, "tab characters must not be used in indentation")), 45 === i) && z(e.input.charCodeAt(e.position + 1));)if (l = !0, e.position++, ge(e, !0, -1) && e.lineIndent <= t) a.push(null), i = e.input.charCodeAt(e.position); else if (n = e.line, we(e, t, 3, !1, !0), a.push(e.result), ge(e, !0, -1), i = e.input.charCodeAt(e.position), (e.line === n || e.lineIndent > t) && 0 !== i) ce(e, "bad indentation of a sequence entry"); else if (e.lineIndent < t) break; return !!l && (e.tag = r, e.anchor = o, e.kind = "sequence", e.result = a, !0) } function Ae(e) { var t, n, i, r, o = !1, a = !1; if (33 !== (r = e.input.charCodeAt(e.position))) return !1; if (null !== e.tag && ce(e, "duplication of a tag property"), 60 === (r = e.input.charCodeAt(++e.position)) ? (o = !0, r = e.input.charCodeAt(++e.position)) : 33 === r ? (a = !0, n = "!!", r = e.input.charCodeAt(++e.position)) : n = "!", t = e.position, o) { do { r = e.input.charCodeAt(++e.position); } while (0 !== r && 62 !== r); e.position < e.length ? (i = e.input.slice(t, e.position), r = e.input.charCodeAt(++e.position)) : ce(e, "unexpected end of the stream within a verbatim tag"); } else { for (; 0 !== r && !z(r);)33 === r && (a ? ce(e, "tag suffix cannot contain exclamation marks") : (n = e.input.slice(t - 1, e.position + 1), G.test(n) || ce(e, "named tag handle cannot contain such characters"), a = !0, t = e.position + 1)), r = e.input.charCodeAt(++e.position); i = e.input.slice(t, e.position), $.test(i) && ce(e, "tag suffix cannot contain flow indicator characters"); } i && !V.test(i) && ce(e, "tag name cannot contain such characters: " + i); try { i = decodeURIComponent(i); } catch (t) { ce(e, "tag name is malformed: " + i); } return o ? e.tag = i : P.call(e.tagMap, n) ? e.tag = e.tagMap[n] + i : "!" === n ? e.tag = "!" + i : "!!" === n ? e.tag = "tag:yaml.org,2002:" + i : ce(e, 'undeclared tag handle "' + n + '"'), !0 } function ve(e) { var t, n; if (38 !== (n = e.input.charCodeAt(e.position))) return !1; for (null !== e.anchor && ce(e, "duplication of an anchor property"), n = e.input.charCodeAt(++e.position), t = e.position; 0 !== n && !z(n) && !X(n);)n = e.input.charCodeAt(++e.position); return e.position === t && ce(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(t, e.position), !0 } function we(e, t, i, r, o) { var a, l, c, s, u, p, f, d, h, g = 1, m = !1, y = !1; if (null !== e.listener && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, a = l = c = 4 === i || 3 === i, r && ge(e, !0, -1) && (m = !0, e.lineIndent > t ? g = 1 : e.lineIndent === t ? g = 0 : e.lineIndent < t && (g = -1)), 1 === g) for (; Ae(e) || ve(e);)ge(e, !0, -1) ? (m = !0, c = a, e.lineIndent > t ? g = 1 : e.lineIndent === t ? g = 0 : e.lineIndent < t && (g = -1)) : c = !1; if (c && (c = m || o), 1 !== g && 4 !== i || (d = 1 === i || 2 === i ? t : t + 1, h = e.position - e.lineStart, 1 === g ? c && (be(e, h) || function (e, t, n) { var i, r, o, a, l, c, s, u = e.tag, p = e.anchor, f = {}, d = Object.create(null), h = null, g = null, m = null, y = !1, b = !1; if (-1 !== e.firstTabInLine) return !1; for (null !== e.anchor && (e.anchorMap[e.anchor] = f), s = e.input.charCodeAt(e.position); 0 !== s;) { if (y || -1 === e.firstTabInLine || (e.position = e.firstTabInLine, ce(e, "tab characters must not be used in indentation")), i = e.input.charCodeAt(e.position + 1), o = e.line, 63 !== s && 58 !== s || !z(i)) { if (a = e.line, l = e.lineStart, c = e.position, !we(e, n, 2, !1, !0)) break; if (e.line === o) { for (s = e.input.charCodeAt(e.position); Q(s);)s = e.input.charCodeAt(++e.position); if (58 === s) z(s = e.input.charCodeAt(++e.position)) || ce(e, "a whitespace character is expected after the key-value separator within a block mapping"), y && (de(e, f, d, h, g, null, a, l, c), h = g = m = null), b = !0, y = !1, r = !1, h = e.tag, g = e.result; else { if (!b) return e.tag = u, e.anchor = p, !0; ce(e, "can not read an implicit mapping pair; a colon is missed"); } } else { if (!b) return e.tag = u, e.anchor = p, !0; ce(e, "can not read a block mapping entry; a multiline key may not be an implicit key"); } } else 63 === s ? (y && (de(e, f, d, h, g, null, a, l, c), h = g = m = null), b = !0, y = !0, r = !0) : y ? (y = !1, r = !0) : ce(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, s = i; if ((e.line === o || e.lineIndent > t) && (y && (a = e.line, l = e.lineStart, c = e.position), we(e, t, 4, !0, r) && (y ? g = e.result : m = e.result), y || (de(e, f, d, h, g, m, a, l, c), h = g = m = null), ge(e, !0, -1), s = e.input.charCodeAt(e.position)), (e.line === o || e.lineIndent > t) && 0 !== s) ce(e, "bad indentation of a mapping entry"); else if (e.lineIndent < t) break } return y && de(e, f, d, h, g, null, a, l, c), b && (e.tag = u, e.anchor = p, e.kind = "mapping", e.result = f), b }(e, h, d)) || function (e, t) { var n, i, r, o, a, l, c, s, u, p, f, d, h = !0, g = e.tag, m = e.anchor, y = Object.create(null); if (91 === (d = e.input.charCodeAt(e.position))) a = 93, s = !1, o = []; else { if (123 !== d) return !1; a = 125, s = !0, o = {}; } for (null !== e.anchor && (e.anchorMap[e.anchor] = o), d = e.input.charCodeAt(++e.position); 0 !== d;) { if (ge(e, !0, t), (d = e.input.charCodeAt(e.position)) === a) return e.position++, e.tag = g, e.anchor = m, e.kind = s ? "mapping" : "sequence", e.result = o, !0; h ? 44 === d && ce(e, "expected the node content, but found ','") : ce(e, "missed comma between flow collection entries"), f = null, l = c = !1, 63 === d && z(e.input.charCodeAt(e.position + 1)) && (l = c = !0, e.position++, ge(e, !0, t)), n = e.line, i = e.lineStart, r = e.position, we(e, t, 1, !1, !0), p = e.tag, u = e.result, ge(e, !0, t), d = e.input.charCodeAt(e.position), !c && e.line !== n || 58 !== d || (l = !0, d = e.input.charCodeAt(++e.position), ge(e, !0, t), we(e, t, 1, !1, !0), f = e.result), s ? de(e, o, y, p, u, f, n, i, r) : l ? o.push(de(e, null, y, p, u, f, n, i, r)) : o.push(u), ge(e, !0, t), 44 === (d = e.input.charCodeAt(e.position)) ? (h = !0, d = e.input.charCodeAt(++e.position)) : h = !1; } ce(e, "unexpected end of the stream within a flow collection"); }(e, d) ? y = !0 : (l && function (e, t) { var i, r, o, a, l, c = 1, s = !1, u = !1, p = t, f = 0, d = !1; if (124 === (a = e.input.charCodeAt(e.position))) r = !1; else { if (62 !== a) return !1; r = !0; } for (e.kind = "scalar", e.result = ""; 0 !== a;)if (43 === (a = e.input.charCodeAt(++e.position)) || 45 === a) 1 === c ? c = 43 === a ? 3 : 2 : ce(e, "repeat of a chomping mode identifier"); else { if (!((o = 48 <= (l = a) && l <= 57 ? l - 48 : -1) >= 0)) break; 0 === o ? ce(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : u ? ce(e, "repeat of an indentation width identifier") : (p = t + o - 1, u = !0); } if (Q(a)) { do { a = e.input.charCodeAt(++e.position); } while (Q(a)); if (35 === a) do { a = e.input.charCodeAt(++e.position); } while (!J(a) && 0 !== a) } for (; 0 !== a;) { for (he(e), e.lineIndent = 0, a = e.input.charCodeAt(e.position); (!u || e.lineIndent < p) && 32 === a;)e.lineIndent++, a = e.input.charCodeAt(++e.position); if (!u && e.lineIndent > p && (p = e.lineIndent), J(a)) f++; else { if (e.lineIndent < p) { 3 === c ? e.result += n.repeat("\n", s ? 1 + f : f) : 1 === c && s && (e.result += "\n"); break } for (r ? Q(a) ? (d = !0, e.result += n.repeat("\n", s ? 1 + f : f)) : d ? (d = !1, e.result += n.repeat("\n", f + 1)) : 0 === f ? s && (e.result += " ") : e.result += n.repeat("\n", f) : e.result += n.repeat("\n", s ? 1 + f : f), s = !0, u = !0, f = 0, i = e.position; !J(a) && 0 !== a;)a = e.input.charCodeAt(++e.position); pe(e, i, e.position, !1); } } return !0 }(e, d) || function (e, t) { var n, i, r; if (39 !== (n = e.input.charCodeAt(e.position))) return !1; for (e.kind = "scalar", e.result = "", e.position++, i = r = e.position; 0 !== (n = e.input.charCodeAt(e.position));)if (39 === n) { if (pe(e, i, e.position, !0), 39 !== (n = e.input.charCodeAt(++e.position))) return !0; i = e.position, e.position++, r = e.position; } else J(n) ? (pe(e, i, r, !0), ye(e, ge(e, !1, t)), i = r = e.position) : e.position === e.lineStart && me(e) ? ce(e, "unexpected end of the document within a single quoted scalar") : (e.position++, r = e.position); ce(e, "unexpected end of the stream within a single quoted scalar"); }(e, d) || function (e, t) { var n, i, r, o, a, l, c; if (34 !== (l = e.input.charCodeAt(e.position))) return !1; for (e.kind = "scalar", e.result = "", e.position++, n = i = e.position; 0 !== (l = e.input.charCodeAt(e.position));) { if (34 === l) return pe(e, n, e.position, !0), e.position++, !0; if (92 === l) { if (pe(e, n, e.position, !0), J(l = e.input.charCodeAt(++e.position))) ge(e, !1, t); else if (l < 256 && ie[l]) e.result += re[l], e.position++; else if ((a = 120 === (c = l) ? 2 : 117 === c ? 4 : 85 === c ? 8 : 0) > 0) { for (r = a, o = 0; r > 0; r--)(a = ee(l = e.input.charCodeAt(++e.position))) >= 0 ? o = (o << 4) + a : ce(e, "expected hexadecimal character"); e.result += ne(o), e.position++; } else ce(e, "unknown escape sequence"); n = i = e.position; } else J(l) ? (pe(e, n, i, !0), ye(e, ge(e, !1, t)), n = i = e.position) : e.position === e.lineStart && me(e) ? ce(e, "unexpected end of the document within a double quoted scalar") : (e.position++, i = e.position); } ce(e, "unexpected end of the stream within a double quoted scalar"); }(e, d) ? y = !0 : !function (e) { var t, n, i; if (42 !== (i = e.input.charCodeAt(e.position))) return !1; for (i = e.input.charCodeAt(++e.position), t = e.position; 0 !== i && !z(i) && !X(i);)i = e.input.charCodeAt(++e.position); return e.position === t && ce(e, "name of an alias node must contain at least one character"), n = e.input.slice(t, e.position), P.call(e.anchorMap, n) || ce(e, 'unidentified alias "' + n + '"'), e.result = e.anchorMap[n], ge(e, !0, -1), !0 }(e) ? function (e, t, n) { var i, r, o, a, l, c, s, u, p = e.kind, f = e.result; if (z(u = e.input.charCodeAt(e.position)) || X(u) || 35 === u || 38 === u || 42 === u || 33 === u || 124 === u || 62 === u || 39 === u || 34 === u || 37 === u || 64 === u || 96 === u) return !1; if ((63 === u || 45 === u) && (z(i = e.input.charCodeAt(e.position + 1)) || n && X(i))) return !1; for (e.kind = "scalar", e.result = "", r = o = e.position, a = !1; 0 !== u;) { if (58 === u) { if (z(i = e.input.charCodeAt(e.position + 1)) || n && X(i)) break } else if (35 === u) { if (z(e.input.charCodeAt(e.position - 1))) break } else { if (e.position === e.lineStart && me(e) || n && X(u)) break; if (J(u)) { if (l = e.line, c = e.lineStart, s = e.lineIndent, ge(e, !1, -1), e.lineIndent >= t) { a = !0, u = e.input.charCodeAt(e.position); continue } e.position = o, e.line = l, e.lineStart = c, e.lineIndent = s; break } } a && (pe(e, r, o, !1), ye(e, e.line - l), r = o = e.position, a = !1), Q(u) || (o = e.position + 1), u = e.input.charCodeAt(++e.position); } return pe(e, r, o, !1), !!e.result || (e.kind = p, e.result = f, !1) }(e, d, 1 === i) && (y = !0, null === e.tag && (e.tag = "?")) : (y = !0, null === e.tag && null === e.anchor || ce(e, "alias node should not have any properties")), null !== e.anchor && (e.anchorMap[e.anchor] = e.result)) : 0 === g && (y = c && be(e, h))), null === e.tag) null !== e.anchor && (e.anchorMap[e.anchor] = e.result); else if ("?" === e.tag) { for (null !== e.result && "scalar" !== e.kind && ce(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), s = 0, u = e.implicitTypes.length; s < u; s += 1)if ((f = e.implicitTypes[s]).resolve(e.result)) { e.result = f.construct(e.result), e.tag = f.tag, null !== e.anchor && (e.anchorMap[e.anchor] = e.result); break } } else if ("!" !== e.tag) { if (P.call(e.typeMap[e.kind || "fallback"], e.tag)) f = e.typeMap[e.kind || "fallback"][e.tag]; else for (f = null, s = 0, u = (p = e.typeMap.multi[e.kind || "fallback"]).length; s < u; s += 1)if (e.tag.slice(0, p[s].tag.length) === p[s].tag) { f = p[s]; break } f || ce(e, "unknown tag !<" + e.tag + ">"), null !== e.result && f.kind !== e.kind && ce(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + f.kind + '", not "' + e.kind + '"'), f.resolve(e.result, e.tag) ? (e.result = f.construct(e.result, e.tag), null !== e.anchor && (e.anchorMap[e.anchor] = e.result)) : ce(e, "cannot resolve a node with !<" + e.tag + "> explicit tag"); } return null !== e.listener && e.listener("close", e), null !== e.tag || null !== e.anchor || y } function ke(e) { var t, n, i, r, o = e.position, a = !1; for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = Object.create(null), e.anchorMap = Object.create(null); 0 !== (r = e.input.charCodeAt(e.position)) && (ge(e, !0, -1), r = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || 37 !== r));) { for (a = !0, r = e.input.charCodeAt(++e.position), t = e.position; 0 !== r && !z(r);)r = e.input.charCodeAt(++e.position); for (i = [], (n = e.input.slice(t, e.position)).length < 1 && ce(e, "directive name must not be less than one character in length"); 0 !== r;) { for (; Q(r);)r = e.input.charCodeAt(++e.position); if (35 === r) { do { r = e.input.charCodeAt(++e.position); } while (0 !== r && !J(r)); break } if (J(r)) break; for (t = e.position; 0 !== r && !z(r);)r = e.input.charCodeAt(++e.position); i.push(e.input.slice(t, e.position)); } 0 !== r && he(e), P.call(ue, n) ? ue[n](e, n, i) : se(e, 'unknown document directive "' + n + '"'); } ge(e, !0, -1), 0 === e.lineIndent && 45 === e.input.charCodeAt(e.position) && 45 === e.input.charCodeAt(e.position + 1) && 45 === e.input.charCodeAt(e.position + 2) ? (e.position += 3, ge(e, !0, -1)) : a && ce(e, "directives end mark is expected"), we(e, e.lineIndent - 1, 4, !1, !0), ge(e, !0, -1), e.checkLineBreaks && H.test(e.input.slice(o, e.position)) && se(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && me(e) ? 46 === e.input.charCodeAt(e.position) && (e.position += 3, ge(e, !0, -1)) : e.position < e.length - 1 && ce(e, "end of the stream or a document separator is expected"); } function Ce(e, t) { t = t || {}, 0 !== (e = String(e)).length && (10 !== e.charCodeAt(e.length - 1) && 13 !== e.charCodeAt(e.length - 1) && (e += "\n"), 65279 === e.charCodeAt(0) && (e = e.slice(1))); var n = new ae(e, t), i = e.indexOf("\0"); for (-1 !== i && (n.position = i, ce(n, "null byte is not allowed in input")), n.input += "\0"; 32 === n.input.charCodeAt(n.position);)n.lineIndent += 1, n.position += 1; for (; n.position < n.length - 1;)ke(n); return n.documents } var xe = { loadAll: function (e, t, n) { null !== t && "object" == typeof t && void 0 === n && (n = t, t = null); var i = Ce(e, n); if ("function" != typeof t) return i; for (var r = 0, o = i.length; r < o; r += 1)t(i[r]); }, load: function (e, t) { var n = Ce(e, t); if (0 !== n.length) { if (1 === n.length) return n[0]; throw new o("expected a single document in the stream, but found more") } } }, Ie = Object.prototype.toString, Se = Object.prototype.hasOwnProperty, Oe = 65279, je = { 0: "\\0", 7: "\\a", 8: "\\b", 9: "\\t", 10: "\\n", 11: "\\v", 12: "\\f", 13: "\\r", 27: "\\e", 34: '\\"', 92: "\\\\", 133: "\\N", 160: "\\_", 8232: "\\L", 8233: "\\P" }, Te = ["y", "Y", "yes", "Yes", "YES", "on", "On", "ON", "n", "N", "no", "No", "NO", "off", "Off", "OFF"], Ne = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/; function Fe(e) { var t, i, r; if (t = e.toString(16).toUpperCase(), e <= 255) i = "x", r = 2; else if (e <= 65535) i = "u", r = 4; else { if (!(e <= 4294967295)) throw new o("code point within a string may not be greater than 0xFFFFFFFF"); i = "U", r = 8; } return "\\" + i + n.repeat("0", r - t.length) + t } function Ee(e) { this.schema = e.schema || K, this.indent = Math.max(1, e.indent || 2), this.noArrayIndent = e.noArrayIndent || !1, this.skipInvalid = e.skipInvalid || !1, this.flowLevel = n.isNothing(e.flowLevel) ? -1 : e.flowLevel, this.styleMap = function (e, t) { var n, i, r, o, a, l, c; if (null === t) return {}; for (n = {}, r = 0, o = (i = Object.keys(t)).length; r < o; r += 1)a = i[r], l = String(t[a]), "!!" === a.slice(0, 2) && (a = "tag:yaml.org,2002:" + a.slice(2)), (c = e.compiledTypeMap.fallback[a]) && Se.call(c.styleAliases, l) && (l = c.styleAliases[l]), n[a] = l; return n }(this.schema, e.styles || null), this.sortKeys = e.sortKeys || !1, this.lineWidth = e.lineWidth || 80, this.noRefs = e.noRefs || !1, this.noCompatMode = e.noCompatMode || !1, this.condenseFlow = e.condenseFlow || !1, this.quotingType = '"' === e.quotingType ? 2 : 1, this.forceQuotes = e.forceQuotes || !1, this.replacer = "function" == typeof e.replacer ? e.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null; } function Me(e, t) { for (var i, r = n.repeat(" ", t), o = 0, a = -1, l = "", c = e.length; o < c;)-1 === (a = e.indexOf("\n", o)) ? (i = e.slice(o), o = c) : (i = e.slice(o, a + 1), o = a + 1), i.length && "\n" !== i && (l += r), l += i; return l } function Le(e, t) { return "\n" + n.repeat(" ", e.indent * t) } function _e(e) { return 32 === e || 9 === e } function De(e) { return 32 <= e && e <= 126 || 161 <= e && e <= 55295 && 8232 !== e && 8233 !== e || 57344 <= e && e <= 65533 && e !== Oe || 65536 <= e && e <= 1114111 } function Ue(e) { return De(e) && e !== Oe && 13 !== e && 10 !== e } function qe(e, t, n) { var i = Ue(e), r = i && !_e(e); return (n ? i : i && 44 !== e && 91 !== e && 93 !== e && 123 !== e && 125 !== e) && 35 !== e && !(58 === t && !r) || Ue(t) && !_e(t) && 35 === e || 58 === t && r } function Ye(e, t) { var n, i = e.charCodeAt(t); return i >= 55296 && i <= 56319 && t + 1 < e.length && (n = e.charCodeAt(t + 1)) >= 56320 && n <= 57343 ? 1024 * (i - 55296) + n - 56320 + 65536 : i } function Re(e) { return /^\n* /.test(e) } function Be(e, t, n, i, r, o, a, l) { var c, s, u = 0, p = null, f = !1, d = !1, h = -1 !== i, g = -1, m = De(s = Ye(e, 0)) && s !== Oe && !_e(s) && 45 !== s && 63 !== s && 58 !== s && 44 !== s && 91 !== s && 93 !== s && 123 !== s && 125 !== s && 35 !== s && 38 !== s && 42 !== s && 33 !== s && 124 !== s && 61 !== s && 62 !== s && 39 !== s && 34 !== s && 37 !== s && 64 !== s && 96 !== s && function (e) { return !_e(e) && 58 !== e }(Ye(e, e.length - 1)); if (t || a) for (c = 0; c < e.length; u >= 65536 ? c += 2 : c++) { if (!De(u = Ye(e, c))) return 5; m = m && qe(u, p, l), p = u; } else { for (c = 0; c < e.length; u >= 65536 ? c += 2 : c++) { if (10 === (u = Ye(e, c))) f = !0, h && (d = d || c - g - 1 > i && " " !== e[g + 1], g = c); else if (!De(u)) return 5; m = m && qe(u, p, l), p = u; } d = d || h && c - g - 1 > i && " " !== e[g + 1]; } return f || d ? n > 9 && Re(e) ? 5 : a ? 2 === o ? 5 : 2 : d ? 4 : 3 : !m || a || r(e) ? 2 === o ? 5 : 2 : 1 } function Ke(e, t, n, i, r) { e.dump = function () { if (0 === t.length) return 2 === e.quotingType ? '""' : "''"; if (!e.noCompatMode && (-1 !== Te.indexOf(t) || Ne.test(t))) return 2 === e.quotingType ? '"' + t + '"' : "'" + t + "'"; var a = e.indent * Math.max(1, n), l = -1 === e.lineWidth ? -1 : Math.max(Math.min(e.lineWidth, 40), e.lineWidth - a), c = i || e.flowLevel > -1 && n >= e.flowLevel; switch (Be(t, c, e.indent, l, (function (t) { return function (e, t) { var n, i; for (n = 0, i = e.implicitTypes.length; n < i; n += 1)if (e.implicitTypes[n].resolve(t)) return !0; return !1 }(e, t) }), e.quotingType, e.forceQuotes && !i, r)) { case 1: return t; case 2: return "'" + t.replace(/'/g, "''") + "'"; case 3: return "|" + Pe(t, e.indent) + We(Me(t, a)); case 4: return ">" + Pe(t, e.indent) + We(Me(function (e, t) { var n, i, r = /(\n+)([^\n]*)/g, o = (l = e.indexOf("\n"), l = -1 !== l ? l : e.length, r.lastIndex = l, He(e.slice(0, l), t)), a = "\n" === e[0] || " " === e[0]; var l; for (; i = r.exec(e);) { var c = i[1], s = i[2]; n = " " === s[0], o += c + (a || n || "" === s ? "" : "\n") + He(s, t), a = n; } return o }(t, l), a)); case 5: return '"' + function (e) { for (var t, n = "", i = 0, r = 0; r < e.length; i >= 65536 ? r += 2 : r++)i = Ye(e, r), !(t = je[i]) && De(i) ? (n += e[r], i >= 65536 && (n += e[r + 1])) : n += t || Fe(i); return n }(t) + '"'; default: throw new o("impossible error: invalid scalar style") } }(); } function Pe(e, t) { var n = Re(e) ? String(t) : "", i = "\n" === e[e.length - 1]; return n + (i && ("\n" === e[e.length - 2] || "\n" === e) ? "+" : i ? "" : "-") + "\n" } function We(e) { return "\n" === e[e.length - 1] ? e.slice(0, -1) : e } function He(e, t) { if ("" === e || " " === e[0]) return e; for (var n, i, r = / [^ ]/g, o = 0, a = 0, l = 0, c = ""; n = r.exec(e);)(l = n.index) - o > t && (i = a > o ? a : l, c += "\n" + e.slice(o, i), o = i + 1), a = l; return c += "\n", e.length - o > t && a > o ? c += e.slice(o, a) + "\n" + e.slice(a + 1) : c += e.slice(o), c.slice(1) } function $e(e, t, n, i) { var r, o, a, l = "", c = e.tag; for (r = 0, o = n.length; r < o; r += 1)a = n[r], e.replacer && (a = e.replacer.call(n, String(r), a)), (Ve(e, t + 1, a, !0, !0, !1, !0) || void 0 === a && Ve(e, t + 1, null, !0, !0, !1, !0)) && (i && "" === l || (l += Le(e, t)), e.dump && 10 === e.dump.charCodeAt(0) ? l += "-" : l += "- ", l += e.dump); e.tag = c, e.dump = l || "[]"; } function Ge(e, t, n) { var i, r, a, l, c, s; for (a = 0, l = (r = n ? e.explicitTypes : e.implicitTypes).length; a < l; a += 1)if (((c = r[a]).instanceOf || c.predicate) && (!c.instanceOf || "object" == typeof t && t instanceof c.instanceOf) && (!c.predicate || c.predicate(t))) { if (n ? c.multi && c.representName ? e.tag = c.representName(t) : e.tag = c.tag : e.tag = "?", c.represent) { if (s = e.styleMap[c.tag] || c.defaultStyle, "[object Function]" === Ie.call(c.represent)) i = c.represent(t, s); else { if (!Se.call(c.represent, s)) throw new o("!<" + c.tag + '> tag resolver accepts not "' + s + '" style'); i = c.represent[s](t, s); } e.dump = i; } return !0 } return !1 } function Ve(e, t, n, i, r, a, l) { e.tag = null, e.dump = n, Ge(e, n, !1) || Ge(e, n, !0); var c, s = Ie.call(e.dump), u = i; i && (i = e.flowLevel < 0 || e.flowLevel > t); var p, f, d = "[object Object]" === s || "[object Array]" === s; if (d && (f = -1 !== (p = e.duplicates.indexOf(n))), (null !== e.tag && "?" !== e.tag || f || 2 !== e.indent && t > 0) && (r = !1), f && e.usedDuplicates[p]) e.dump = "*ref_" + p; else { if (d && f && !e.usedDuplicates[p] && (e.usedDuplicates[p] = !0), "[object Object]" === s) i && 0 !== Object.keys(e.dump).length ? (!function (e, t, n, i) { var r, a, l, c, s, u, p = "", f = e.tag, d = Object.keys(n); if (!0 === e.sortKeys) d.sort(); else if ("function" == typeof e.sortKeys) d.sort(e.sortKeys); else if (e.sortKeys) throw new o("sortKeys must be a boolean or a function"); for (r = 0, a = d.length; r < a; r += 1)u = "", i && "" === p || (u += Le(e, t)), c = n[l = d[r]], e.replacer && (c = e.replacer.call(n, l, c)), Ve(e, t + 1, l, !0, !0, !0) && ((s = null !== e.tag && "?" !== e.tag || e.dump && e.dump.length > 1024) && (e.dump && 10 === e.dump.charCodeAt(0) ? u += "?" : u += "? "), u += e.dump, s && (u += Le(e, t)), Ve(e, t + 1, c, !0, s) && (e.dump && 10 === e.dump.charCodeAt(0) ? u += ":" : u += ": ", p += u += e.dump)); e.tag = f, e.dump = p || "{}"; }(e, t, e.dump, r), f && (e.dump = "&ref_" + p + e.dump)) : (!function (e, t, n) { var i, r, o, a, l, c = "", s = e.tag, u = Object.keys(n); for (i = 0, r = u.length; i < r; i += 1)l = "", "" !== c && (l += ", "), e.condenseFlow && (l += '"'), a = n[o = u[i]], e.replacer && (a = e.replacer.call(n, o, a)), Ve(e, t, o, !1, !1) && (e.dump.length > 1024 && (l += "? "), l += e.dump + (e.condenseFlow ? '"' : "") + ":" + (e.condenseFlow ? "" : " "), Ve(e, t, a, !1, !1) && (c += l += e.dump)); e.tag = s, e.dump = "{" + c + "}"; }(e, t, e.dump), f && (e.dump = "&ref_" + p + " " + e.dump)); else if ("[object Array]" === s) i && 0 !== e.dump.length ? (e.noArrayIndent && !l && t > 0 ? $e(e, t - 1, e.dump, r) : $e(e, t, e.dump, r), f && (e.dump = "&ref_" + p + e.dump)) : (!function (e, t, n) { var i, r, o, a = "", l = e.tag; for (i = 0, r = n.length; i < r; i += 1)o = n[i], e.replacer && (o = e.replacer.call(n, String(i), o)), (Ve(e, t, o, !1, !1) || void 0 === o && Ve(e, t, null, !1, !1)) && ("" !== a && (a += "," + (e.condenseFlow ? "" : " ")), a += e.dump); e.tag = l, e.dump = "[" + a + "]"; }(e, t, e.dump), f && (e.dump = "&ref_" + p + " " + e.dump)); else { if ("[object String]" !== s) { if ("[object Undefined]" === s) return !1; if (e.skipInvalid) return !1; throw new o("unacceptable kind of an object to dump " + s) } "?" !== e.tag && Ke(e, e.dump, t, a, u); } null !== e.tag && "?" !== e.tag && (c = encodeURI("!" === e.tag[0] ? e.tag.slice(1) : e.tag).replace(/!/g, "%21"), c = "!" === e.tag[0] ? "!" + c : "tag:yaml.org,2002:" === c.slice(0, 18) ? "!!" + c.slice(18) : "!<" + c + ">", e.dump = c + " " + e.dump); } return !0 } function Ze(e, t) { var n, i, r = [], o = []; for (Je(e, r, o), n = 0, i = o.length; n < i; n += 1)t.duplicates.push(r[o[n]]); t.usedDuplicates = new Array(i); } function Je(e, t, n) { var i, r, o; if (null !== e && "object" == typeof e) if (-1 !== (r = t.indexOf(e))) -1 === n.indexOf(r) && n.push(r); else if (t.push(e), Array.isArray(e)) for (r = 0, o = e.length; r < o; r += 1)Je(e[r], t, n); else for (r = 0, o = (i = Object.keys(e)).length; r < o; r += 1)Je(e[i[r]], t, n); } function Qe(e, t) { return function () { throw new Error("Function yaml." + e + " is removed in js-yaml 4. Use yaml." + t + " instead, which is now safe by default.") } } var ze = p, Xe = h, et = b, tt = O, nt = j, it = K, rt = xe.load, ot = xe.loadAll, at = { dump: function (e, t) { var n = new Ee(t = t || {}); n.noRefs || Ze(e, n); var i = e; return n.replacer && (i = n.replacer.call({ "": i }, "", i)), Ve(n, 0, i, !0, !0) ? n.dump + "\n" : "" } }.dump, lt = o, ct = { binary: L, float: S, map: y, null: A, pairs: Y, set: B, timestamp: F, bool: v, int: C, merge: E, omap: U, seq: m, str: g }, st = Qe("safeLoad", "load"), ut = Qe("safeLoadAll", "loadAll"), pt = Qe("safeDump", "dump"), ft = { Type: ze, Schema: Xe, FAILSAFE_SCHEMA: et, JSON_SCHEMA: tt, CORE_SCHEMA: nt, DEFAULT_SCHEMA: it, load: rt, loadAll: ot, dump: at, YAMLException: lt, types: ct, safeLoad: st, safeLoadAll: ut, safeDump: pt }; e.CORE_SCHEMA = nt, e.DEFAULT_SCHEMA = it, e.FAILSAFE_SCHEMA = et, e.JSON_SCHEMA = tt, e.Schema = Xe, e.Type = ze, e.YAMLException = lt, e.default = ft, e.dump = at, e.load = rt, e.loadAll = ot, e.safeDump = pt, e.safeLoad = st, e.safeLoadAll = ut, e.types = ct, Object.defineProperty(e, "__esModule", { value: !0 }); }));

    		// Initialize plugin when either DOM is ready or Alpine is ready
    		async function initializeCollectionsPlugin() {
    		    // Initialize empty collections store
    		    const initialStore = {
    		        all: [], // Global content array for cross-collection access
    		        _initialized: false
    		    };
    		    Alpine.store('collections', initialStore);

    		    // Cache for loaded collections with persistence
    		    const collectionCache = new Map();
    		    const loadingPromises = new Map();
    		    const CACHE_PREFIX = 'indux_collection_';
    		    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    		    // Track initialization state
    		    let isInitializing = false;
    		    let initializationComplete = false;

    		    // Load from persistent cache
    		    function loadFromCache(key) {
    		        try {
    		            const cached = localStorage.getItem(CACHE_PREFIX + key);
    		            if (cached) {
    		                const { data, timestamp } = JSON.parse(cached);
    		                if (Date.now() - timestamp < CACHE_DURATION) {
    		                    return data;
    		                }
    		            }
    		        } catch (error) {
    		            console.warn('[Indux] Cache read failed:', error);
    		        }
    		        return null;
    		    }

    		    // Save to persistent cache
    		    function saveToCache(key, data) {
    		        try {
    		            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
    		                data,
    		                timestamp: Date.now()
    		            }));
    		        } catch (error) {
    		            console.warn('[Indux] Cache write failed:', error);
    		        }
    		    }

    		    // Load manifest if not already loaded
    		    async function ensureManifest() {
    		        if (window.manifest) return window.manifest;

    		        try {
    		            const response = await fetch('/manifest.json');
    		            window.manifest = await response.json();
    		            return window.manifest;
    		        } catch (error) {
    		            console.error('[Indux] Failed to load manifest:', error);
    		            return null;
    		        }
    		    }

    		    // Load collection data
    		    async function loadCollection(collectionName, locale = 'en') {
    		        const cacheKey = `${collectionName}:${locale}`;

    		        // Check memory cache first
    		        if (collectionCache.has(cacheKey)) {
    		            const cachedData = collectionCache.get(cacheKey);
    		            if (!isInitializing) {
    		                updateStore(collectionName, cachedData);
    		            }
    		            return cachedData;
    		        }

    		        // Check persistent cache
    		        const cachedData = loadFromCache(cacheKey);
    		        if (cachedData) {
    		            collectionCache.set(cacheKey, cachedData);
    		            if (!isInitializing) {
    		                updateStore(collectionName, cachedData);
    		            }
    		            return cachedData;
    		        }

    		        // If already loading, return existing promise
    		        if (loadingPromises.has(cacheKey)) {
    		            return loadingPromises.get(cacheKey);
    		        }

    		        const loadPromise = (async () => {
    		            try {
    		                const manifest = await ensureManifest();
    		                if (!manifest?.collections) {
    		                    return null;
    		                }

    		                const collection = manifest.collections[collectionName];
    		                if (!collection) {
    		                    console.warn(`[Indux] Collection "${collectionName}" not found in manifest`);
    		                    return null;
    		                }

    		                // Handle both string paths and localized objects
    		                let source;
    		                if (typeof collection === 'string') {
    		                    // Direct string path for non-localized collections
    		                    source = collection;
    		                } else if (collection[locale]) {
    		                    // Localized collection with locale-specific path
    		                    source = collection[locale];
    		                } else {
    		                    console.warn(`[Indux] No source found for collection "${collectionName}" in locale "${locale}"`);
    		                    return null;
    		                }

    		                const response = await fetch(source);
    		                const contentType = response.headers.get('content-type');
    		                let data;

    		                // Handle different content types
    		                if (contentType?.includes('application/json')) {
    		                    data = await response.json();
    		                } else if (contentType?.includes('text/yaml') || source.endsWith('.yaml') || source.endsWith('.yml')) {
    		                    const text = await response.text();
    		                    data = jsyaml.load(text);
    		                } else {
    		                    console.warn(`[Indux] Unsupported content type for "${source}": ${contentType}`);
    		                    return null;
    		                }

    		                // Enhance data with metadata
    		                let enhancedData;
    		                if (Array.isArray(data)) {
    		                    enhancedData = data.map(item => ({
    		                        ...item,
    		                        contentType: collectionName,
    		                        _loadedFrom: source,
    		                        _locale: locale
    		                    }));
    		                } else if (typeof data === 'object') {
    		                    enhancedData = {
    		                        ...data,
    		                        contentType: collectionName,
    		                        _loadedFrom: source,
    		                        _locale: locale
    		                    };
    		                }

    		                // Update caches
    		                collectionCache.set(cacheKey, enhancedData);
    		                saveToCache(cacheKey, enhancedData);

    		                // Update store only if not initializing
    		                if (!isInitializing) {
    		                    updateStore(collectionName, enhancedData);
    		                }

    		                return enhancedData;
    		            } catch (error) {
    		                console.error(`[Indux] Failed to load collection "${collectionName}":`, error);
    		                return null;
    		            } finally {
    		                loadingPromises.delete(cacheKey);
    		            }
    		        })();

    		        loadingPromises.set(cacheKey, loadPromise);
    		        return loadPromise;
    		    }

    		    // Update store with new data
    		    function updateStore(collectionName, data) {
    		        if (isInitializing) return;

    		        const store = Alpine.store('collections');
    		        const all = store.all.filter(item => item.contentType !== collectionName);

    		        if (Array.isArray(data)) {
    		            all.push(...data);
    		        } else {
    		            all.push(data);
    		        }

    		        Alpine.store('collections', {
    		            ...store,
    		            [collectionName]: data,
    		            all,
    		            _initialized: true
    		        });
    		    }

    		    // Create a safe proxy for loading state
    		    function createLoadingProxy() {
    		        return new Proxy({}, {
    		            get(target, key) {
    		                // Handle special keys
    		                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                    return undefined;
    		                }

    		                // Handle toPrimitive for text content
    		                if (key === Symbol.toPrimitive) {
    		                    return function () { return ''; };
    		                }

    		                // Handle numeric keys for array access
    		                if (typeof key === 'string' && !isNaN(Number(key))) {
    		                    return createLoadingProxy();
    		                }

    		                // Return empty object for nested properties
    		                return createLoadingProxy();
    		            }
    		        });
    		    }

    		    // Create a proxy for array items
    		    function createArrayItemProxy(item) {
    		        return new Proxy(item, {
    		            get(target, key) {
    		                // Handle special keys
    		                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                    return undefined;
    		                }

    		                // Handle toPrimitive for text content
    		                if (key === Symbol.toPrimitive) {
    		                    return function () {
    		                        return target[key] || '';
    		                    };
    		                }

    		                // Handle route-aware access
    		                if (key === 'route' && typeof window !== 'undefined' && window.location) {
    		                    return function (matchPath) {
    		                        // Check if router is available
    		                        if (!window.InduxRoutingNavigation) {
    		                            console.warn('[Indux] Router not available for route-aware collection access');
    		                            return createLoadingProxy();
    		                        }

    		                        return createRouteAwareProxy(target, matchPath);
    		                    };
    		                }

    		                // Return the actual value, not a proxy
    		                const value = target[key];
    		                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    		                    return value;
    		                }

    		                // For objects and arrays, return a proxy
    		                if (value && typeof value === 'object') {
    		                    if (Array.isArray(value)) {
    		                        return new Proxy(value, {
    		                            get(target, nestedKey) {
    		                                if (nestedKey === 'length') {
    		                                    return target.length;
    		                                }
    		                                if (typeof nestedKey === 'string' && !isNaN(Number(nestedKey))) {
    		                                    const index = Number(nestedKey);
    		                                    if (index >= 0 && index < target.length) {
    		                                        return createArrayItemProxy(target[index]);
    		                                    }
    		                                    return createLoadingProxy();
    		                                }
    		                                return createLoadingProxy();
    		                            }
    		                        });
    		                    }
    		                    return new Proxy(value, {
    		                        get(target, nestedKey) {
    		                            // Handle special keys
    		                            if (nestedKey === Symbol.iterator || nestedKey === 'then' || nestedKey === 'catch' || nestedKey === 'finally') {
    		                                return undefined;
    		                            }

    		                            // Handle toPrimitive for text content
    		                            if (nestedKey === Symbol.toPrimitive) {
    		                                return function () {
    		                                    return target[nestedKey] || '';
    		                                };
    		                            }

    		                            // Handle route-aware access
    		                            if (nestedKey === 'route' && typeof window !== 'undefined' && window.location) {
    		                                return function (matchPath) {
    		                                    // Check if router is available
    		                                    if (!window.InduxRoutingNavigation) {
    		                                        console.warn('[Indux] Router not available for route-aware collection access');
    		                                        return createLoadingProxy();
    		                                    }

    		                                    return createRouteAwareProxy(target, matchPath);
    		                                };
    		                            }

    		                            return target[nestedKey];
    		                        }
    		                    });
    		                }

    		                return value;
    		            }
    		        });
    		    }

    		    // Find item by route matching
    		    function findItemByRoute(data, matchPath, currentRoute) {
    		        if (!data || !currentRoute) return null;

    		        // Normalize current route
    		        const normalizedRoute = currentRoute.replace(/^\/+|\/+$/g, '') || '/';
    		        const routeSegments = normalizedRoute.split('/').filter(segment => segment.length > 0);

    		        // Helper function to recursively search for the match property
    		        function findMatch(obj) {
    		            if (Array.isArray(obj)) {
    		                // Handle arrays - search each item
    		                for (let i = 0; i < obj.length; i++) {
    		                    const result = findMatch(obj[i]);
    		                    if (result) return result;
    		                }
    		                return null;
    		            } else if (obj && typeof obj === 'object') {
    		                // Handle objects - check if this object has the match property
    		                if (obj[matchPath]) {
    		                    const matchValue = obj[matchPath];
    		                    // Check if the match value appears anywhere in the route segments
    		                    if (routeSegments.includes(matchValue)) {
    		                        return obj;
    		                    }
    		                }

    		                // Recursively search all properties
    		                for (const key in obj) {
    		                    if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
    		                        const result = findMatch(obj[key]);
    		                        if (result) return result;
    		                    }
    		                }
    		            }

    		            return null;
    		        }

    		        return findMatch(data);
    		    }

    		    // Create route-aware proxy
    		    function createRouteAwareProxy(data, matchPath) {
    		        // Create a reactive Alpine component that automatically updates on route changes
    		        const reactiveProxy = Alpine.reactive({
    		            _data: data,
    		            _matchPath: matchPath,
    		            _currentRoute: window.location.pathname,
    		            _matchedItem: null,

    		            // Computed property that updates automatically
    		            get matchedItem() {
    		                this._currentRoute = window.location.pathname;
    		                this._matchedItem = findItemByRoute(this._data, this._matchPath, this._currentRoute);
    		                return this._matchedItem;
    		            }
    		        });

    		        // Set up route change listeners to trigger reactivity
    		        const routeChangeHandler = () => {
    		            reactiveProxy._currentRoute = window.location.pathname;
    		        };

    		        window.addEventListener('indux:route-change', routeChangeHandler);
    		        window.addEventListener('popstate', routeChangeHandler);

    		        // Return a proxy that delegates to the reactive component
    		        return new Proxy({}, {
    		            get(target, key) {
    		                // Handle special keys
    		                if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                    return undefined;
    		                }

    		                // Handle toPrimitive for text content
    		                if (key === Symbol.toPrimitive) {
    		                    return function () {
    		                        const matchedItem = reactiveProxy.matchedItem;
    		                        return matchedItem ? (matchedItem[key] || '') : '';
    		                    };
    		                }

    		                // Get the current matched item (reactive)
    		                const matchedItem = reactiveProxy.matchedItem;

    		                if (!matchedItem) {
    		                    return createLoadingProxy();
    		                }

    		                // Return the actual value, not a proxy
    		                const value = matchedItem[key];
    		                if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    		                    return value;
    		                }

    		                // For objects and arrays, return a proxy
    		                if (value && typeof value === 'object') {
    		                    if (Array.isArray(value)) {
    		                        return new Proxy(value, {
    		                            get(target, nestedKey) {
    		                                if (nestedKey === 'length') {
    		                                    return target.length;
    		                                }
    		                                if (typeof nestedKey === 'string' && !isNaN(Number(nestedKey))) {
    		                                    const index = Number(nestedKey);
    		                                    if (index >= 0 && index < target.length) {
    		                                        return createArrayItemProxy(target[index]);
    		                                    }
    		                                    return createLoadingProxy();
    		                                }
    		                                return createLoadingProxy();
    		                            }
    		                        });
    		                    }
    		                    return new Proxy(value, {
    		                        get(target, nestedKey) {
    		                            // Handle special keys
    		                            if (nestedKey === Symbol.iterator || nestedKey === 'then' || nestedKey === 'catch' || nestedKey === 'finally') {
    		                                return undefined;
    		                            }

    		                            // Handle toPrimitive for text content
    		                            if (nestedKey === Symbol.toPrimitive) {
    		                                return function () {
    		                                    return target[nestedKey] || '';
    		                                };
    		                            }

    		                            return target[nestedKey];
    		                        }
    		                    });
    		                }

    		                return value;
    		            }
    		        });
    		    }

    		    // Initialize store first to ensure it exists
    		    if (!Alpine.store('collections')) {
    		        Alpine.store('collections', {
    		            all: [],
    		            _initialized: true
    		        });
    		    }

    		    // Add $x magic method
    		    Alpine.magic('x', () => {
    		        const pendingLoads = new Map();
    		        
    		        // Ensure store exists
    		        let store = Alpine.store('collections');
    		        if (!store) {
    		            Alpine.store('collections', {
    		                all: [],
    		                _initialized: true
    		            });
    		            store = Alpine.store('collections');
    		        }
    		        
    		        // Create a fallback route function that returns a loading proxy
    		        const fallbackRouteFunction = function(matchPath) {
    		            return new Proxy({}, {
    		                get(target, key) {
    		                    // Handle special keys
    		                    if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                        return undefined;
    		                    }

    		                    // Handle toPrimitive for text content
    		                    if (key === Symbol.toPrimitive) {
    		                        return function () { return ''; };
    		                    }

    		                    // Return loading proxy for all properties
    		                    return createLoadingProxy();
    		                }
    		            });
    		        };

    		        // Listen for locale changes
    		        window.addEventListener('localechange', async (event) => {
    		            event.detail.locale;

    		            // Clear existing collections and cache
    		            Alpine.store('collections');
    		            collectionCache.clear();
    		            Alpine.store('collections', {
    		                all: [],
    		                _initialized: true
    		            });

    		            // Collections will be reloaded on-demand when accessed
    		        });

    		        return new Proxy({}, {
    		            get(target, prop) {
    		                // Handle special keys
    		                if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
    		                    return undefined;
    		                }

    		                // Get current value from store
    		                const value = store[prop];
    		                const currentLocale = Alpine.store('locale')?.current || 'en';

    		                // If not in store, try to load it
    		                if (!value && !pendingLoads.has(prop)) {
    		                    // Start loading
    		                    const loadPromise = loadCollection(prop, currentLocale);
    		                    pendingLoads.set(prop, loadPromise);
    		                    return createLoadingProxy();
    		                }

    		                // If no value is available yet, return a proxy that provides fallback route function
    		                if (!value) {
    		                    return new Proxy({}, {
    		                        get(target, key) {
    		                            // Handle special keys
    		                            if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                                return undefined;
    		                            }

    		                            // Handle toPrimitive for text content
    		                            if (key === Symbol.toPrimitive) {
    		                                return function () { return ''; };
    		                            }

    		                            // Handle route-aware access - return fallback function
    		                            if (key === 'route' && typeof window !== 'undefined' && window.location) {
    		                                return fallbackRouteFunction;
    		                            }

    		                            // Return loading proxy for other properties
    		                            return createLoadingProxy();
    		                        }
    		                    });
    		                }

    		                // If we have a value, return a reactive proxy
    		                if (value) {
    		                    return new Proxy(value, {
    		                        get(target, key) {
    		                            // Handle special keys
    		                            if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                                return undefined;
    		                            }

    		                            // Handle toPrimitive for text content
    		                            if (key === Symbol.toPrimitive) {
    		                                return function () { return ''; };
    		                            }

    		                            // Handle route-aware access
    		                            if (key === 'route' && typeof window !== 'undefined' && window.location) {
    		                                return function (matchPath) {
    		                                    // Check if router is available
    		                                    if (!window.InduxRoutingNavigation) {
    		                                        console.warn('[Indux] Router not available for route-aware collection access');
    		                                        return createLoadingProxy();
    		                                    }

    		                                    return createRouteAwareProxy(target, matchPath);
    		                                };
    		                            }

    		                            // Handle array-like behavior
    		                            if (Array.isArray(target)) {
    		                                if (key === 'length') {
    		                                    return target.length;
    		                                }
    		                                // Handle numeric keys for array access
    		                                if (typeof key === 'string' && !isNaN(Number(key))) {
    		                                    const index = Number(key);
    		                                    if (index >= 0 && index < target.length) {
    		                                        return createArrayItemProxy(target[index]);
    		                                    }
    		                                    return createLoadingProxy();
    		                                }
    		                            }

    		                            // Handle nested objects
    		                            const nestedValue = target[key];
    		                            if (nestedValue) {
    		                                if (Array.isArray(nestedValue)) {
    		                                    return new Proxy(nestedValue, {
    		                                        get(target, nestedKey) {
    		                                            if (nestedKey === 'length') {
    		                                                return target.length;
    		                                            }
    		                                            if (typeof nestedKey === 'string' && !isNaN(Number(nestedKey))) {
    		                                                const index = Number(nestedKey);
    		                                                if (index >= 0 && index < target.length) {
    		                                                    return createArrayItemProxy(target[index]);
    		                                                }
    		                                                return createLoadingProxy();
    		                                            }

    		                                            // Handle route-aware access
    		                                            if (nestedKey === 'route' && typeof window !== 'undefined' && window.location) {
    		                                                return function (matchPath) {
    		                                                    // Check if router is available
    		                                                    if (!window.InduxRoutingNavigation) {
    		                                                        console.warn('[Indux] Router not available for route-aware collection access');
    		                                                        return createLoadingProxy();
    		                                                    }

    		                                                    return createRouteAwareProxy(target, matchPath);
    		                                                };
    		                                            }

    		                                            return createLoadingProxy();
    		                                        }
    		                                    });
    		                                }
    		                                return new Proxy(nestedValue, {
    		                                    get(target, nestedKey) {
    		                                        // Handle special keys
    		                                        if (nestedKey === Symbol.iterator || nestedKey === 'then' || nestedKey === 'catch' || nestedKey === 'finally') {
    		                                            return undefined;
    		                                        }

    		                                        // Handle toPrimitive for text content
    		                                        if (nestedKey === Symbol.toPrimitive) {
    		                                            return function () {
    		                                                return target[nestedKey] || '';
    		                                            };
    		                                        }

    		                                        // Handle route-aware access
    		                                        if (nestedKey === 'route' && typeof window !== 'undefined' && window.location) {
    		                                            return function (matchPath) {
    		                                                // Check if router is available
    		                                                if (!window.InduxRoutingNavigation) {
    		                                                    console.warn('[Indux] Router not available for route-aware collection access');
    		                                                    return createLoadingProxy();
    		                                                }

    		                                                return createRouteAwareProxy(target, matchPath);
    		                                            };
    		                                        }

    		                                        return target[nestedKey];
    		                                    }
    		                                });
    		                            }
    		                            return createLoadingProxy();
    		                        }
    		                    });
    		                }

    		                // If no value is available yet, return a proxy that provides fallback route function
    		                return new Proxy({}, {
    		                    get(target, key) {
    		                        // Handle special keys
    		                        if (key === Symbol.iterator || key === 'then' || key === 'catch' || key === 'finally') {
    		                            return undefined;
    		                        }

    		                        // Handle toPrimitive for text content
    		                        if (key === Symbol.toPrimitive) {
    		                            return function () { return ''; };
    		                        }

    		                        // Handle route-aware access - return fallback function
    		                        if (key === 'route' && typeof window !== 'undefined' && window.location) {
    		                            return fallbackRouteFunction;
    		                        }

    		                        return createLoadingProxy();
    		                    }
    		                });
    		            }
    		        });
    		    });

    		    // Initialize collections after magic method is registered
    		    if (isInitializing || initializationComplete) return;
    		    isInitializing = true;

    		    try {
    		        // Initialize store without loading all collections
    		        Alpine.store('collections', {
    		            all: [],
    		            _initialized: true
    		        });

    		        // Collections will be loaded on-demand when accessed via $x
    		    } finally {
    		        isInitializing = false;
    		        initializationComplete = true;
    		    }
    		}

    		// Handle both DOMContentLoaded and alpine:init
    		if (document.readyState === 'loading') {
    		    document.addEventListener('DOMContentLoaded', () => {
    		        if (window.Alpine) initializeCollectionsPlugin();
    		    });
    		}

    		document.addEventListener('alpine:init', initializeCollectionsPlugin); 
    	} (indux_collections$1, indux_collections$1.exports));
    	return indux_collections$1.exports;
    }

    requireIndux_collections();

    /*! Indux Dropdowns 1.0.0 - MIT License */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeDropdownPlugin() {
        // Ensure Alpine.js context exists for directives to work
        function ensureAlpineContext() {
            const body = document.body;
            if (!body.hasAttribute('x-data')) {
                body.setAttribute('x-data', '{}');
            }
        }

        // Helper to register directives
        function registerDirective(name, handler) {
            Alpine.directive(name, handler);
        }

        // Check if a menu element is nested within another menu
        const isNestedMenu = (menu) => {
            let parent = menu.parentElement;
            while (parent) {
                if (parent.tagName === 'MENU' && parent.hasAttribute('popover')) {
                    return true;
                }
                parent = parent.parentElement;
            }
            return false;
        };

        // Ensure Alpine.js context exists
        ensureAlpineContext();

        // Register dropdown directive
        registerDirective('dropdown', (el, { modifiers, expression }, { effect }) => {
            let menu;

            if (modifiers.includes('hover')) {
                let hoverTimeout;
                let autoCloseTimeout;

                const handleShowPopover = () => {
                    if (menu) {
                        clearTimeout(hoverTimeout);
                        clearTimeout(autoCloseTimeout);
                        menu.showPopover();
                    }
                };

                const handleHidePopover = () => {
                    hoverTimeout = setTimeout(() => {
                        if (menu && !menu.matches(':hover')) {
                            menu.hidePopover();
                        }
                    }, 150);
                };

                // Global mouse tracking for auto-close
                const handleGlobalMouseMove = (e) => {
                    if (!menu?.matches(':popover-open')) return;

                    const isOverButton = el.contains(e.target) || el === e.target;
                    const isOverMenu = menu.contains(e.target) || menu === e.target;

                    if (!isOverButton && !isOverMenu) {
                        clearTimeout(autoCloseTimeout);
                        autoCloseTimeout = setTimeout(() => {
                            menu?.hidePopover();
                        }, 1000);
                    } else {
                        clearTimeout(autoCloseTimeout);
                    }
                };

                document.addEventListener('mousemove', handleGlobalMouseMove);
                el.addEventListener('mouseenter', handleShowPopover);
                el.addEventListener('mouseleave', handleHidePopover);
            }

            effect(() => {

                // Defer processing to ensure Alpine is fully ready
                setTimeout(() => {

                    if (!window.Alpine) {
                        console.warn('[Indux] Alpine not available for dropdown processing');
                        return;
                    }

                    // Generate a unique anchor code for positioning
                    const anchorCode = Math.random().toString(36).substr(2, 9);

                    // Check if expression refers to a template ID
                    if (expression && document.getElementById(expression)?.tagName === 'TEMPLATE') {
                        // Clone template content and generate unique ID
                        const template = document.getElementById(expression);
                        menu = template.content.cloneNode(true).firstElementChild;
                        const dropdownId = `dropdown-${anchorCode}`;
                        menu.setAttribute('id', dropdownId);
                        document.body.appendChild(menu);
                        el.setAttribute('popovertarget', dropdownId);

                        // Initialize Alpine on the cloned menu
                        Alpine.initTree(menu);
                    } else {
                        // Original behavior for static dropdowns
                        const dropdownId = expression || `dropdown-${anchorCode}`;
                        menu = document.getElementById(dropdownId);
                        if (!menu) {
                            console.warn(`[Indux] Dropdown menu with id "${dropdownId}" not found`);
                            return;
                        }
                        el.setAttribute('popovertarget', dropdownId);
                    }

                    // Set up popover
                    menu.setAttribute('popover', '');

                    // Set up anchor positioning
                    const anchorName = `--dropdown-${anchorCode}`;
                    el.style.setProperty('anchor-name', anchorName);
                    menu.style.setProperty('position-anchor', anchorName);

                    // Define positioning maps
                    const cornerPositions = {
                        'bottom.left': { area: 'bottom left', margin: 'var(--spacing-popover-offset)' },
                        'bottom.right': { area: 'bottom right', margin: 'var(--spacing-popover-offset)' },
                        'top.left': { area: 'top left', margin: 'var(--spacing-popover-offset)' },
                        'top.right': { area: 'top right', margin: 'var(--spacing-popover-offset)' }
                    };

                    const alignmentPositions = {
                        'bottom.start': { area: 'block-end span-inline-end', margin: 'var(--spacing-popover-offset) 0' },
                        'bottom.end': { area: 'block-end span-inline-start', margin: 'var(--spacing-popover-offset) 0' },
                        'top.start': { area: 'block-start span-inline-end', margin: 'var(--spacing-popover-offset) 0' },
                        'top.end': { area: 'block-start span-inline-start', margin: 'var(--spacing-popover-offset) 0' },
                        'left.start': { area: 'inline-start span-block-end', margin: '0 var(--spacing-popover-offset)' },
                        'left.end': { area: 'inline-start span-block-start', margin: '0 var(--spacing-popover-offset)' },
                        'right.start': { area: 'inline-end span-block-end', margin: '0 var(--spacing-popover-offset)' },
                        'right.end': { area: 'inline-end span-block-start', margin: '0 var(--spacing-popover-offset)' }
                    };

                    const singleDirections = {
                        'bottom': { area: 'block-end', margin: 'var(--spacing-popover-offset) 0' },
                        'top': { area: 'block-start', margin: 'var(--spacing-popover-offset) 0' },
                        'left': { area: 'inline-start', margin: '0 var(--spacing-popover-offset)' },
                        'right': { area: 'inline-end', margin: '0 var(--spacing-popover-offset)' }
                    };

                    // Find primary direction
                    const direction = ['bottom', 'top', 'left', 'right'].find(dir => modifiers.includes(dir));
                    if (!direction) {
                        // Default positioning - right start for nested menus, bottom middle for top-level
                        if (isNestedMenu(menu)) {
                            const position = alignmentPositions['right.start'];
                            menu.style.setProperty('position-area', position.area);
                            menu.style.setProperty('margin', position.margin);
                        } else {
                            menu.style.setProperty('position-area', 'block-end span-inline-end');
                            menu.style.setProperty('margin', 'var(--spacing-popover-offset) 0');
                        }
                        return;
                    }

                    // Check for corner positioning
                    const corner = ['left', 'right'].find(side =>
                        side !== direction && modifiers.includes(side)
                    );
                    if (corner) {
                        const position = cornerPositions[`${direction}.${corner}`];
                        menu.style.setProperty('position-area', position.area);
                        menu.style.setProperty('margin', position.margin);
                        return;
                    }

                    // Check for alignment
                    const alignment = ['start', 'end'].find(align => modifiers.includes(align));
                    if (alignment) {
                        const position = alignmentPositions[`${direction}.${alignment}`];
                        menu.style.setProperty('position-area', position.area);
                        menu.style.setProperty('margin', position.margin);
                        return;
                    }

                    // Single direction
                    const position = singleDirections[direction];
                    menu.style.setProperty('position-area', position.area);
                    menu.style.setProperty('margin', position.margin);

                    // Add keyboard navigation handling
                    menu.addEventListener('keydown', (e) => {
                        if (e.key === 'Tab') {
                            // Get all focusable elements
                            const focusable = menu.querySelectorAll(
                                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                            );

                            // If we're on the last focusable element and tabbing forward
                            if (!e.shiftKey && e.target === focusable[focusable.length - 1]) {
                                e.preventDefault();
                                menu.hidePopover();
                                // Focus the next focusable element after the dropdown trigger
                                const allFocusable = document.querySelectorAll(
                                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                                );
                                const triggerIndex = Array.from(allFocusable).indexOf(el);
                                const nextElement = allFocusable[triggerIndex + 1];
                                if (nextElement) nextElement.focus();
                            }

                            // If we're on the first element and tabbing backward
                            if (e.shiftKey && e.target === focusable[0]) {
                                menu.hidePopover();
                            }
                        }

                        // Close on Escape
                        if (e.key === 'Escape') {
                            menu.hidePopover();
                            el.focus();
                        }
                    });

                    // Add hover functionality
                    if (modifiers.includes('hover')) {
                        let hoverTimeout;

                        menu.addEventListener('mouseenter', () => {
                            clearTimeout(hoverTimeout);
                        });

                        menu.addEventListener('mouseleave', () => {
                            hoverTimeout = setTimeout(() => {
                                menu.hidePopover();
                            }, 150);
                        });
                    }

                    // Update hover menu handling
                    if (modifiers.includes('hover')) {
                        menu.addEventListener('mouseenter', () => {
                            clearTimeout(autoCloseTimeout);
                        });

                        menu.addEventListener('mouseleave', () => {
                            // Start tracking for auto-close immediately when leaving menu
                            const event = new MouseEvent('mousemove', {
                                clientX: window.event?.clientX ?? 0,
                                clientY: window.event?.clientY ?? 0
                            });
                            document.dispatchEvent(event);
                        });
                    }
                });
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) {
                initializeDropdownPlugin();
            } else {
                // Wait for Alpine to be available
                document.addEventListener('alpine:init', initializeDropdownPlugin);
            }
        });
    } else {
        // DOM is already loaded
        if (window.Alpine) {
            initializeDropdownPlugin();
        } else {
            // Wait for Alpine to be available
            document.addEventListener('alpine:init', initializeDropdownPlugin);
        }
    }

    // Also listen for alpine:init as a backup
    document.addEventListener('alpine:init', initializeDropdownPlugin);

    var indux_icons = {};

    /*! Iconify 3.1.1 - MIT License */

    var hasRequiredIndux_icons;

    function requireIndux_icons () {
    	if (hasRequiredIndux_icons) return indux_icons;
    	hasRequiredIndux_icons = 1;
    	(function (exports) {
    		var Iconify = function (t) { const e = Object.freeze({ left: 0, top: 0, width: 16, height: 16 }), n = Object.freeze({ rotate: 0, vFlip: !1, hFlip: !1 }), o = Object.freeze({ ...e, ...n }), r = Object.freeze({ ...o, body: "", hidden: !1 }); function i(t, e) { const o = function (t, e) { const n = {}; !t.hFlip != !e.hFlip && (n.hFlip = !0), !t.vFlip != !e.vFlip && (n.vFlip = !0); const o = ((t.rotate || 0) + (e.rotate || 0)) % 4; return o && (n.rotate = o), n }(t, e); for (const i in r) i in n ? i in t && !(i in o) && (o[i] = n[i]) : i in e ? o[i] = e[i] : i in t && (o[i] = t[i]); return o } function c(t, e, n) { const o = t.icons, r = t.aliases || Object.create(null); let c = {}; function s(t) { c = i(o[t] || r[t], c); } return s(e), n.forEach(s), i(t, c) } function s(t, e) { const n = []; if ("object" != typeof t || "object" != typeof t.icons) return n; t.not_found instanceof Array && t.not_found.forEach((t => { e(t, null), n.push(t); })); const o = function (t, e) { const n = t.icons, o = t.aliases || Object.create(null), r = Object.create(null); return (Object.keys(n).concat(Object.keys(o))).forEach((function t(e) { if (n[e]) return r[e] = []; if (!(e in r)) { r[e] = null; const n = o[e] && o[e].parent, i = n && t(n); i && (r[e] = [n].concat(i)); } return r[e] })), r }(t); for (const r in o) { const i = o[r]; i && (e(r, c(t, r, i)), n.push(r)); } return n } const a = /^[a-z0-9]+(-[a-z0-9]+)*$/, u = (t, e, n, o = "") => { const r = t.split(":"); if ("@" === t.slice(0, 1)) { if (r.length < 2 || r.length > 3) return null; o = r.shift().slice(1); } if (r.length > 3 || !r.length) return null; if (r.length > 1) { const t = r.pop(), n = r.pop(), i = { provider: r.length > 0 ? r[0] : o, prefix: n, name: t }; return e && !f(i) ? null : i } const i = r[0], c = i.split("-"); if (c.length > 1) { const t = { provider: o, prefix: c.shift(), name: c.join("-") }; return e && !f(t) ? null : t } if (n && "" === o) { const t = { provider: o, prefix: "", name: i }; return e && !f(t, n) ? null : t } return null }, f = (t, e) => !!t && !("" !== t.provider && !t.provider.match(a) || !(e && "" === t.prefix || t.prefix.match(a)) || !t.name.match(a)), l = { provider: "", aliases: {}, not_found: {}, ...e }; function d(t, e) { for (const n in e) if (n in t && typeof t[n] != typeof e[n]) return !1; return !0 } function p(t) { if ("object" != typeof t || null === t) return null; const e = t; if ("string" != typeof e.prefix || !t.icons || "object" != typeof t.icons) return null; if (!d(t, l)) return null; const n = e.icons; for (const t in n) { const e = n[t]; if (!t.match(a) || "string" != typeof e.body || !d(e, r)) return null } const o = e.aliases || Object.create(null); for (const t in o) { const e = o[t], i = e.parent; if (!t.match(a) || "string" != typeof i || !n[i] && !o[i] || !d(e, r)) return null } return e } const h = Object.create(null); function g(t, e) { const n = h[t] || (h[t] = Object.create(null)); return n[e] || (n[e] = function (t, e) { return { provider: t, prefix: e, icons: Object.create(null), missing: new Set } }(t, e)) } function m(t, e) { return p(e) ? s(e, ((e, n) => { n ? t.icons[e] = n : t.missing.add(e); })) : [] } function y(t, e) { let n = []; return ("string" == typeof t ? [t] : Object.keys(h)).forEach((t => { ("string" == typeof t && "string" == typeof e ? [e] : Object.keys(h[t] || {})).forEach((e => { const o = g(t, e); n = n.concat(Object.keys(o.icons).map((n => ("" !== t ? "@" + t + ":" : "") + e + ":" + n))); })); })), n } let b = !1; function v(t) { const e = "string" == typeof t ? u(t, !0, b) : t; if (e) { const t = g(e.provider, e.prefix), n = e.name; return t.icons[n] || (t.missing.has(n) ? null : void 0) } } function x(t, e) { const n = u(t, !0, b); if (!n) return !1; return function (t, e, n) { try { if ("string" == typeof n.body) return t.icons[e] = { ...n }, !0 } catch (t) { } return !1 }(g(n.provider, n.prefix), n.name, e) } function w(t, e) { if ("object" != typeof t) return !1; if ("string" != typeof e && (e = t.provider || ""), b) ; const n = t.prefix; if (!f({ provider: e, prefix: n, name: "a" })) return !1; return !!m(g(e, n), t) } function S(t) { return !!v(t) } function j(t) { const e = v(t); return e ? { ...o, ...e } : null } const E = Object.freeze({ width: null, height: null }), I = Object.freeze({ ...E, ...n }), O = /(-?[0-9.]*[0-9]+[0-9.]*)/g, k = /^-?[0-9.]*[0-9]+[0-9.]*$/g; function C(t, e, n) { if (1 === e) return t; if (n = n || 100, "number" == typeof t) return Math.ceil(t * e * n) / n; if ("string" != typeof t) return t; const o = t.split(O); if (null === o || !o.length) return t; const r = []; let i = o.shift(), c = k.test(i); for (; ;) { if (c) { const t = parseFloat(i); isNaN(t) ? r.push(i) : r.push(Math.ceil(t * e * n) / n); } else r.push(i); if (i = o.shift(), void 0 === i) return r.join(""); c = !c; } } const M = t => "unset" === t || "undefined" === t || "none" === t; function T(t, e) { const n = { ...o, ...t }, r = { ...I, ...e }, i = { left: n.left, top: n.top, width: n.width, height: n.height }; let c = n.body;[n, r].forEach((t => { const e = [], n = t.hFlip, o = t.vFlip; let r, s = t.rotate; switch (n ? o ? s += 2 : (e.push("translate(" + (i.width + i.left).toString() + " " + (0 - i.top).toString() + ")"), e.push("scale(-1 1)"), i.top = i.left = 0) : o && (e.push("translate(" + (0 - i.left).toString() + " " + (i.height + i.top).toString() + ")"), e.push("scale(1 -1)"), i.top = i.left = 0), s < 0 && (s -= 4 * Math.floor(s / 4)), s %= 4, s) { case 1: r = i.height / 2 + i.top, e.unshift("rotate(90 " + r.toString() + " " + r.toString() + ")"); break; case 2: e.unshift("rotate(180 " + (i.width / 2 + i.left).toString() + " " + (i.height / 2 + i.top).toString() + ")"); break; case 3: r = i.width / 2 + i.left, e.unshift("rotate(-90 " + r.toString() + " " + r.toString() + ")"); }s % 2 == 1 && (i.left !== i.top && (r = i.left, i.left = i.top, i.top = r), i.width !== i.height && (r = i.width, i.width = i.height, i.height = r)), e.length && (c = '<g transform="' + e.join(" ") + '">' + c + "</g>"); })); const s = r.width, a = r.height, u = i.width, f = i.height; let l, d; null === s ? (d = null === a ? "1em" : "auto" === a ? f : a, l = C(d, u / f)) : (l = "auto" === s ? u : s, d = null === a ? C(l, f / u) : "auto" === a ? f : a); const p = {}, h = (t, e) => { M(e) || (p[t] = e.toString()); }; return h("width", l), h("height", d), p.viewBox = i.left.toString() + " " + i.top.toString() + " " + u.toString() + " " + f.toString(), { attributes: p, body: c } } const L = /\sid="(\S+)"/g, A = "IconifyId" + Date.now().toString(16) + (16777216 * Math.random() | 0).toString(16); let F = 0; function P(t, e = A) { const n = []; let o; for (; o = L.exec(t);)n.push(o[1]); if (!n.length) return t; const r = "suffix" + (16777216 * Math.random() | Date.now()).toString(16); return n.forEach((n => { const o = "function" == typeof e ? e(n) : e + (F++).toString(), i = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); t = t.replace(new RegExp('([#;"])(' + i + ')([")]|\\.[a-z])', "g"), "$1" + o + r + "$3"); })), t = t.replace(new RegExp(r, "g"), "") } const N = { local: !0, session: !0 }, z = { local: new Set, session: new Set }; let _ = !1; const D = "iconify2", R = "iconify", $ = R + "-count", q = R + "-version", H = 36e5, U = 168; function V(t, e) { try { return t.getItem(e) } catch (t) { } } function Q(t, e, n) { try { return t.setItem(e, n), !0 } catch (t) { } } function G(t, e) { try { t.removeItem(e); } catch (t) { } } function J(t, e) { return Q(t, $, e.toString()) } function B(t) { return parseInt(V(t, $)) || 0 } let K = "undefined" == typeof window ? {} : window; function W(t) { const e = t + "Storage"; try { if (K && K[e] && "number" == typeof K[e].length) return K[e] } catch (t) { } N[t] = !1; } function X(t, e) { const n = W(t); if (!n) return; const o = V(n, q); if (o !== D) { if (o) { const t = B(n); for (let e = 0; e < t; e++)G(n, R + e.toString()); } return Q(n, q, D), void J(n, 0) } const r = Math.floor(Date.now() / H) - U, i = t => { const o = R + t.toString(), i = V(n, o); if ("string" == typeof i) { try { const n = JSON.parse(i); if ("object" == typeof n && "number" == typeof n.cached && n.cached > r && "string" == typeof n.provider && "object" == typeof n.data && "string" == typeof n.data.prefix && e(n, t)) return !0 } catch (t) { } G(n, o); } }; let c = B(n); for (let e = c - 1; e >= 0; e--)i(e) || (e === c - 1 ? (c--, J(n, c)) : z[t].add(e)); } function Y() { if (!_) { _ = !0; for (const t in N) X(t, (t => { const e = t.data, n = g(t.provider, e.prefix); if (!m(n, e).length) return !1; const o = e.lastModified || -1; return n.lastModifiedCached = n.lastModifiedCached ? Math.min(n.lastModifiedCached, o) : o, !0 })); } } function Z(t, e) { switch (t) { case "local": case "session": N[t] = e; break; case "all": for (const t in N) N[t] = e; } } const tt = Object.create(null); function et(t, e) { tt[t] = e; } function nt(t) { return tt[t] || tt[""] } function ot(t) { let e; if ("string" == typeof t.resources) e = [t.resources]; else if (e = t.resources, !(e instanceof Array && e.length)) return null; return { resources: e, path: t.path || "/", maxURL: t.maxURL || 500, rotate: t.rotate || 750, timeout: t.timeout || 5e3, random: !0 === t.random, index: t.index || 0, dataAfterTimeout: !1 !== t.dataAfterTimeout } } const rt = Object.create(null), it = ["https://api.simplesvg.com", "https://api.unisvg.com"], ct = []; for (; it.length > 0;)1 === it.length || Math.random() > .5 ? ct.push(it.shift()) : ct.push(it.pop()); function st(t, e) { const n = ot(e); return null !== n && (rt[t] = n, !0) } function at(t) { return rt[t] } rt[""] = ot({ resources: ["https://api.iconify.design"].concat(ct) }); let ut = (() => { let t; try { if (t = fetch, "function" == typeof t) return t } catch (t) { } })(); const ft = { prepare: (t, e, n) => { const o = [], r = function (t, e) { const n = at(t); if (!n) return 0; let o; if (n.maxURL) { let t = 0; n.resources.forEach((e => { const n = e; t = Math.max(t, n.length); })); const r = e + ".json?icons="; o = n.maxURL - t - n.path.length - r.length; } else o = 0; return o }(t, e), i = "icons"; let c = { type: i, provider: t, prefix: e, icons: [] }, s = 0; return n.forEach(((n, a) => { s += n.length + 1, s >= r && a > 0 && (o.push(c), c = { type: i, provider: t, prefix: e, icons: [] }, s = n.length), c.icons.push(n); })), o.push(c), o }, send: (t, e, n) => { if (!ut) return void n("abort", 424); let o = function (t) { if ("string" == typeof t) { const e = at(t); if (e) return e.path } return "/" }(e.provider); switch (e.type) { case "icons": { const t = e.prefix, n = e.icons.join(","); o += t + ".json?" + new URLSearchParams({ icons: n }).toString(); break } case "custom": { const t = e.uri; o += "/" === t.slice(0, 1) ? t.slice(1) : t; break } default: return void n("abort", 400) }let r = 503; ut(t + o).then((t => { const e = t.status; if (200 === e) return r = 501, t.json(); setTimeout((() => { n(function (t) { return 404 === t }(e) ? "abort" : "next", e); })); })).then((t => { "object" == typeof t && null !== t ? setTimeout((() => { n("success", t); })) : setTimeout((() => { 404 === t ? n("abort", t) : n("next", r); })); })).catch((() => { n("next", r); })); } }; function lt(t, e) { t.forEach((t => { const n = t.loaderCallbacks; n && (t.loaderCallbacks = n.filter((t => t.id !== e))); })); } let dt = 0; var pt = { resources: [], index: 0, timeout: 2e3, rotate: 750, random: !1, dataAfterTimeout: !1 }; function ht(t, e, n, o) { const r = t.resources.length, i = t.random ? Math.floor(Math.random() * r) : t.index; let c; if (t.random) { let e = t.resources.slice(0); for (c = []; e.length > 1;) { const t = Math.floor(Math.random() * e.length); c.push(e[t]), e = e.slice(0, t).concat(e.slice(t + 1)); } c = c.concat(e); } else c = t.resources.slice(i).concat(t.resources.slice(0, i)); const s = Date.now(); let a, u = "pending", f = 0, l = null, d = [], p = []; function h() { l && (clearTimeout(l), l = null); } function g() { "pending" === u && (u = "aborted"), h(), d.forEach((t => { "pending" === t.status && (t.status = "aborted"); })), d = []; } function m(t, e) { e && (p = []), "function" == typeof t && p.push(t); } function y() { u = "failed", p.forEach((t => { t(void 0, a); })); } function b() { d.forEach((t => { "pending" === t.status && (t.status = "aborted"); })), d = []; } function v() { if ("pending" !== u) return; h(); const o = c.shift(); if (void 0 === o) return d.length ? void (l = setTimeout((() => { h(), "pending" === u && (b(), y()); }), t.timeout)) : void y(); const r = { status: "pending", resource: o, callback: (e, n) => { !function (e, n, o) { const r = "success" !== n; switch (d = d.filter((t => t !== e)), u) { case "pending": break; case "failed": if (r || !t.dataAfterTimeout) return; break; default: return }if ("abort" === n) return a = o, void y(); if (r) return a = o, void (d.length || (c.length ? v() : y())); if (h(), b(), !t.random) { const n = t.resources.indexOf(e.resource); -1 !== n && n !== t.index && (t.index = n); } u = "completed", p.forEach((t => { t(o); })); }(r, e, n); } }; d.push(r), f++, l = setTimeout(v, t.rotate), n(o, e, r.callback); } return "function" == typeof o && p.push(o), setTimeout(v), function () { return { startTime: s, payload: e, status: u, queriesSent: f, queriesPending: d.length, subscribe: m, abort: g } } } function gt(t) { const e = { ...pt, ...t }; let n = []; function o() { n = n.filter((t => "pending" === t().status)); } const r = { query: function (t, r, i) { const c = ht(e, t, r, ((t, e) => { o(), i && i(t, e); })); return n.push(c), c }, find: function (t) { return n.find((e => t(e))) || null }, setIndex: t => { e.index = t; }, getIndex: () => e.index, cleanup: o }; return r } function mt() { } const yt = Object.create(null); function bt(t, e, n) { let o, r; if ("string" == typeof t) { const e = nt(t); if (!e) return n(void 0, 424), mt; r = e.send; const i = function (t) { if (!yt[t]) { const e = at(t); if (!e) return; const n = { config: e, redundancy: gt(e) }; yt[t] = n; } return yt[t] }(t); i && (o = i.redundancy); } else { const e = ot(t); if (e) { o = gt(e); const n = nt(t.resources ? t.resources[0] : ""); n && (r = n.send); } } return o && r ? o.query(e, r, n)().abort : (n(void 0, 424), mt) } function vt(t, e) { function n(n) { let o; if (!N[n] || !(o = W(n))) return; const r = z[n]; let i; if (r.size) r.delete(i = Array.from(r).shift()); else if (i = B(o), !J(o, i + 1)) return; const c = { cached: Math.floor(Date.now() / H), provider: t.provider, data: e }; return Q(o, R + i.toString(), JSON.stringify(c)) } _ || Y(), e.lastModified && !function (t, e) { const n = t.lastModifiedCached; if (n && n >= e) return n === e; if (t.lastModifiedCached = e, n) for (const n in N) X(n, (n => { const o = n.data; return n.provider !== t.provider || o.prefix !== t.prefix || o.lastModified === e })); return !0 }(t, e.lastModified) || Object.keys(e.icons).length && (e.not_found && delete (e = Object.assign({}, e)).not_found, n("local") || n("session")); } function xt() { } function wt(t) { t.iconsLoaderFlag || (t.iconsLoaderFlag = !0, setTimeout((() => { t.iconsLoaderFlag = !1, function (t) { t.pendingCallbacksFlag || (t.pendingCallbacksFlag = !0, setTimeout((() => { t.pendingCallbacksFlag = !1; const e = t.loaderCallbacks ? t.loaderCallbacks.slice(0) : []; if (!e.length) return; let n = !1; const o = t.provider, r = t.prefix; e.forEach((e => { const i = e.icons, c = i.pending.length; i.pending = i.pending.filter((e => { if (e.prefix !== r) return !0; const c = e.name; if (t.icons[c]) i.loaded.push({ provider: o, prefix: r, name: c }); else { if (!t.missing.has(c)) return n = !0, !0; i.missing.push({ provider: o, prefix: r, name: c }); } return !1 })), i.pending.length !== c && (n || lt([t], e.id), e.callback(i.loaded.slice(0), i.missing.slice(0), i.pending.slice(0), e.abort)); })); }))); }(t); }))); } const St = t => { const e = g(t.provider, t.prefix).pendingIcons; return !(!e || !e.has(t.name)) }, jt = (t, e) => { const o = function (t) { const e = { loaded: [], missing: [], pending: [] }, n = Object.create(null); t.sort(((t, e) => t.provider !== e.provider ? t.provider.localeCompare(e.provider) : t.prefix !== e.prefix ? t.prefix.localeCompare(e.prefix) : t.name.localeCompare(e.name))); let o = { provider: "", prefix: "", name: "" }; return t.forEach((t => { if (o.name === t.name && o.prefix === t.prefix && o.provider === t.provider) return; o = t; const r = t.provider, i = t.prefix, c = t.name, s = n[r] || (n[r] = Object.create(null)), a = s[i] || (s[i] = g(r, i)); let u; u = c in a.icons ? e.loaded : "" === i || a.missing.has(c) ? e.missing : e.pending; const f = { provider: r, prefix: i, name: c }; u.push(f); })), e }(function (t, e = !0, n = !1) { const o = []; return t.forEach((t => { const r = "string" == typeof t ? u(t, e, n) : t; r && o.push(r); })), o }(t, !0, (b))); if (!o.pending.length) { let t = !0; return e && setTimeout((() => { t && e(o.loaded, o.missing, o.pending, xt); })), () => { t = !1; } } const r = Object.create(null), i = []; let c, s; return o.pending.forEach((t => { const { provider: e, prefix: n } = t; if (n === s && e === c) return; c = e, s = n, i.push(g(e, n)); const o = r[e] || (r[e] = Object.create(null)); o[n] || (o[n] = []); })), o.pending.forEach((t => { const { provider: e, prefix: n, name: o } = t, i = g(e, n), c = i.pendingIcons || (i.pendingIcons = new Set); c.has(o) || (c.add(o), r[e][n].push(o)); })), i.forEach((t => { const { provider: e, prefix: n } = t; r[e][n].length && function (t, e) { t.iconsToLoad ? t.iconsToLoad = t.iconsToLoad.concat(e).sort() : t.iconsToLoad = e, t.iconsQueueFlag || (t.iconsQueueFlag = !0, setTimeout((() => { t.iconsQueueFlag = !1; const { provider: e, prefix: n } = t, o = t.iconsToLoad; let r; delete t.iconsToLoad, o && (r = nt(e)) && r.prepare(e, n, o).forEach((n => { bt(e, n, (e => { if ("object" != typeof e) n.icons.forEach((e => { t.missing.add(e); })); else try { const n = m(t, e); if (!n.length) return; const o = t.pendingIcons; o && n.forEach((t => { o.delete(t); })), vt(t, e); } catch (t) { console.error(t); } wt(t); })); })); }))); }(t, r[e][n]); })), e ? function (t, e, n) { const o = dt++, r = lt.bind(null, n, o); if (!e.pending.length) return r; const i = { id: o, icons: e, callback: t, abort: r }; return n.forEach((t => { (t.loaderCallbacks || (t.loaderCallbacks = [])).push(i); })), r }(e, o, i) : xt }, Et = t => new Promise(((e, n) => { const r = "string" == typeof t ? u(t, !0) : t; r ? jt([r || t], (i => { if (i.length && r) { const t = v(r); if (t) return void e({ ...o, ...t }) } n(t); })) : n(t); })); function It(t, e) { const n = { ...t }; for (const t in e) { const o = e[t], r = typeof o; t in E ? (null === o || o && ("string" === r || "number" === r)) && (n[t] = o) : r === typeof n[t] && (n[t] = "rotate" === t ? o % 4 : o); } return n } const Ot = { ...I, inline: !1 }, kt = "iconify", Ct = "iconify-inline", Mt = "iconifyData" + Date.now(); let Tt = []; function Lt(t) { for (let e = 0; e < Tt.length; e++) { const n = Tt[e]; if (("function" == typeof n.node ? n.node() : n.node) === t) return n } } function At(t, e = !1) { let n = Lt(t); return n ? (n.temporary && (n.temporary = e), n) : (n = { node: t, temporary: e }, Tt.push(n), n) } function Ft() { return Tt } let Pt = null; const Nt = { childList: !0, subtree: !0, attributes: !0 }; function zt(t) { if (!t.observer) return; const e = t.observer; e.pendingScan || (e.pendingScan = setTimeout((() => { delete e.pendingScan, Pt && Pt(t); }))); } function _t(t, e) { if (!t.observer) return; const n = t.observer; if (!n.pendingScan) for (let o = 0; o < e.length; o++) { const r = e[o]; if (r.addedNodes && r.addedNodes.length > 0 || "attributes" === r.type && void 0 !== r.target[Mt]) return void (n.paused || zt(t)) } } function Dt(t, e) { t.observer.instance.observe(e, Nt); } function Rt(t) { let e = t.observer; if (e && e.instance) return; const n = "function" == typeof t.node ? t.node() : t.node; n && window && (e || (e = { paused: 0 }, t.observer = e), e.instance = new window.MutationObserver(_t.bind(null, t)), Dt(t, n), e.paused || zt(t)); } function $t() { Ft().forEach(Rt); } function qt(t) { if (!t.observer) return; const e = t.observer; e.pendingScan && (clearTimeout(e.pendingScan), delete e.pendingScan), e.instance && (e.instance.disconnect(), delete e.instance); } function Ht(t) { const e = null !== Pt; Pt !== t && (Pt = t, e && Ft().forEach(qt)), e ? $t() : function (t) { const e = document; e.readyState && "loading" !== e.readyState ? t() : e.addEventListener("DOMContentLoaded", t); }($t); } function Ut(t) { (t ? [t] : Ft()).forEach((t => { if (!t.observer) return void (t.observer = { paused: 1 }); const e = t.observer; if (e.paused++, e.paused > 1 || !e.instance) return; e.instance.disconnect(); })); } function Vt(t) { if (t) { const e = Lt(t); e && Ut(e); } else Ut(); } function Qt(t) { (t ? [t] : Ft()).forEach((t => { if (!t.observer) return void Rt(t); const e = t.observer; if (e.paused && (e.paused--, !e.paused)) { const n = "function" == typeof t.node ? t.node() : t.node; if (!n) return; e.instance ? Dt(t, n) : Rt(t); } })); } function Gt(t) { if (t) { const e = Lt(t); e && Qt(e); } else Qt(); } function Jt(t, e = !1) { const n = At(t, e); return Rt(n), n } function Bt(t) { const e = Lt(t); e && (qt(e), function (t) { Tt = Tt.filter((e => t !== e && t !== ("function" == typeof e.node ? e.node() : e.node))); }(t)); } const Kt = /[\s,]+/; const Wt = ["width", "height"], Xt = ["inline", "hFlip", "vFlip"]; function Yt(t) { const e = t.getAttribute("data-icon"), n = "string" == typeof e && u(e, !0); if (!n) return null; const o = { ...Ot, inline: t.classList && t.classList.contains(Ct) }; Wt.forEach((e => { const n = t.getAttribute("data-" + e); n && (o[e] = n); })); const r = t.getAttribute("data-rotate"); "string" == typeof r && (o.rotate = function (t, e = 0) { const n = t.replace(/^-?[0-9.]*/, ""); function o(t) { for (; t < 0;)t += 4; return t % 4 } if ("" === n) { const e = parseInt(t); return isNaN(e) ? 0 : o(e) } if (n !== t) { let e = 0; switch (n) { case "%": e = 25; break; case "deg": e = 90; }if (e) { let r = parseFloat(t.slice(0, t.length - n.length)); return isNaN(r) ? 0 : (r /= e, r % 1 == 0 ? o(r) : 0) } } return e }(r)); const i = t.getAttribute("data-flip"); "string" == typeof i && function (t, e) { e.split(Kt).forEach((e => { switch (e.trim()) { case "horizontal": t.hFlip = !0; break; case "vertical": t.vFlip = !0; } })); }(o, i), Xt.forEach((e => { const n = "data-" + e, r = function (t, e) { return t === e || "true" === t || "" !== t && "false" !== t && null }(t.getAttribute(n), n); "boolean" == typeof r && (o[e] = r); })); const c = t.getAttribute("data-mode"); return { name: e, icon: n, customisations: o, mode: c } } const Zt = "svg." + kt + ", i." + kt + ", span." + kt + ", i." + Ct + ", span." + Ct; function te(t, e) { let n = -1 === t.indexOf("xlink:") ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"'; for (const t in e) n += " " + t + '="' + e[t] + '"'; return '<svg xmlns="http://www.w3.org/2000/svg"' + n + ">" + t + "</svg>" } let ee; function ne(t) { return void 0 === ee && function () { try { ee = window.trustedTypes.createPolicy("iconify", { createHTML: t => t }); } catch (t) { ee = null; } }(), ee ? ee.createHTML(t) : t } function oe(t) { const e = new Set(["iconify"]); return ["provider", "prefix"].forEach((n => { t[n] && e.add("iconify--" + t[n]); })), e } function re(t, e, n, o) { const r = t.classList; if (o) { const t = o.classList; Array.from(t).forEach((t => { r.add(t); })); } const i = []; return e.forEach((t => { r.contains(t) ? n.has(t) && i.push(t) : (r.add(t), i.push(t)); })), n.forEach((t => { e.has(t) || r.remove(t); })), i } function ie(t, e, n) { const o = t.style; (n || []).forEach((t => { o.removeProperty(t); })); const r = []; for (const t in e) o.getPropertyValue(t) || (r.push(t), o.setProperty(t, e[t])); return r } function ce(t, e, n) { let o; try { o = document.createElement("span"); } catch (e) { return t } const r = e.customisations, i = T(n, r), c = t[Mt], s = te(P(i.body), { "aria-hidden": "true", role: "img", ...i.attributes }); o.innerHTML = ne(s); const a = o.childNodes[0], u = t.attributes; for (let t = 0; t < u.length; t++) { const e = u.item(t), n = e.name; "class" === n || a.hasAttribute(n) || a.setAttribute(n, e.value); } const f = re(a, oe(e.icon), new Set(c && c.addedClasses), t), l = ie(a, r.inline ? { "vertical-align": "-0.125em" } : {}, c && c.addedStyles), d = { ...e, status: "loaded", addedClasses: f, addedStyles: l }; return a[Mt] = d, t.parentNode && t.parentNode.replaceChild(a, t), a } const se = { display: "inline-block" }, ae = { "background-color": "currentColor" }, ue = { "background-color": "transparent" }, fe = { image: "var(--svg)", repeat: "no-repeat", size: "100% 100%" }, le = { "-webkit-mask": ae, mask: ae, background: ue }; for (const t in le) { const e = le[t]; for (const n in fe) e[t + "-" + n] = fe[n]; } function de(t) { return t + (t.match(/^[-0-9.]+$/) ? "px" : "") } let pe = !1; function he() { pe || (pe = !0, setTimeout((() => { pe && (pe = !1, ge()); }))); } function ge(t, e = !1) { const n = Object.create(null); function r(t, e) { const { provider: o, prefix: r, name: i } = t, c = g(o, r), s = c.icons[i]; if (s) return { status: "loaded", icon: s }; if (c.missing.has(i)) return { status: "missing" }; if (e && !St(t)) { const t = n[o] || (n[o] = Object.create(null)); (t[r] || (t[r] = new Set)).add(i); } return { status: "loading" } } (t ? [t] : Ft()).forEach((t => { const n = "function" == typeof t.node ? t.node() : t.node; if (!n || !n.querySelectorAll) return; let i = !1, c = !1; function s(e, n, r) { if (c || (c = !0, Ut(t)), "SVG" !== e.tagName.toUpperCase()) { const t = n.mode, i = "mask" === t || "bg" !== t && ("style" === t ? -1 !== r.body.indexOf("currentColor") : null); if ("boolean" == typeof i) return void function (t, e, n, o) { const r = e.customisations, i = T(n, r), c = i.attributes, s = t[Mt], a = te(i.body, { ...c, width: n.width + "", height: n.height + "" }), u = re(t, oe(e.icon), new Set(s && s.addedClasses)), f = { "--svg": 'url("' + (l = a, "data:image/svg+xml," + function (t) { return t.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ") }(l) + '")'), width: de(c.width), height: de(c.height), ...se, ...o ? ae : ue }; var l; r.inline && (f["vertical-align"] = "-0.125em"); const d = ie(t, f, s && s.addedStyles), p = { ...e, status: "loaded", addedClasses: u, addedStyles: d }; t[Mt] = p; }(e, n, { ...o, ...r }, i) } ce(e, n, r); } ((function (t) { const e = []; return t.querySelectorAll(Zt).forEach((t => { const n = t[Mt] || "svg" !== t.tagName.toLowerCase() ? Yt(t) : null; n && e.push({ node: t, props: n }); })), e }))(n).forEach((({ node: t, props: e }) => { const n = t[Mt]; if (!n) { const { status: n, icon: o } = r(e.icon, !0); return o ? void s(t, e, o) : (i = i || "loading" === n, void (t[Mt] = { ...e, status: n })) } let o; if (function (t, e) { if (t.name !== e.name || t.mode !== e.mode) return !0; const n = t.customisations, o = e.customisations; for (const t in Ot) if (n[t] !== o[t]) return !0; return !1 }(n, e)) { if (o = r(e.icon, n.name !== e.name), !o.icon) return i = i || "loading" === o.status, void Object.assign(n, { ...e, status: o.status }) } else { if ("loading" !== n.status) return; if (o = r(e.icon, !1), !o.icon) return void (n.status = o.status) } s(t, e, o.icon); })), t.temporary && !i ? Bt(n) : e && i ? Jt(n, !0) : c && t.observer && Qt(t); })); for (const t in n) { const e = n[t]; for (const n in e) { const o = e[n]; jt(Array.from(o).map((e => ({ provider: t, prefix: n, name: e }))), he); } } } function me(t, e, n = !1) { const o = v(t); if (!o) return null; const r = u(t), i = It(Ot, e || {}), c = ce(document.createElement("span"), { name: t, icon: r, customisations: i }, o); return n ? c.outerHTML : c } function ye() { return "3.1.1" } function be(t, e) { return me(t, e, !1) } function ve(t, e) { return me(t, e, !0) } function xe(t, e) { const n = v(t); if (!n) return null; return T(n, It(Ot, e || {})) } function we(t) { t ? function (t) { const e = Lt(t); e ? ge(e) : ge({ node: t, temporary: !0 }, !0); }(t) : ge(); } if ("undefined" != typeof document && "undefined" != typeof window) { !function () { if (document.documentElement) return At(document.documentElement); Tt.push({ node: () => document.documentElement }); }(); const t = window; if (void 0 !== t.IconifyPreload) { const e = t.IconifyPreload, n = "Invalid IconifyPreload syntax."; "object" == typeof e && null !== e && (e instanceof Array ? e : [e]).forEach((t => { try { ("object" != typeof t || null === t || t instanceof Array || "object" != typeof t.icons || "string" != typeof t.prefix || !w(t)) && console.error(n); } catch (t) { console.error(n); } })); } setTimeout((() => { Ht(ge), ge(); })); } function Se(t, e) { Z(t, !1 !== e); } function je(t) { Z(t, !0); } if (et("", ft), "undefined" != typeof document && "undefined" != typeof window) { Y(); const t = window; if (void 0 !== t.IconifyProviders) { const e = t.IconifyProviders; if ("object" == typeof e && null !== e) for (const t in e) { const n = "IconifyProviders[" + t + "] is invalid."; try { const o = e[t]; if ("object" != typeof o || !o || void 0 === o.resources) continue; st(t, o) || console.error(n); } catch (t) { console.error(n); } } } } const Ee = { getAPIConfig: at, setAPIModule: et, sendAPIQuery: bt, setFetch: function (t) { ut = t; }, getFetch: function () { return ut }, listAPIProviders: function () { return Object.keys(rt) } }, Ie = { _api: Ee, addAPIProvider: st, loadIcons: jt, loadIcon: Et, iconExists: S, getIcon: j, listIcons: y, addIcon: x, addCollection: w, replaceIDs: P, calculateSize: C, buildIcon: T, getVersion: ye, renderSVG: be, renderHTML: ve, renderIcon: xe, scan: we, observe: Jt, stopObserving: Bt, pauseObserver: Vt, resumeObserver: Gt, enableCache: Se, disableCache: je }; return t._api = Ee, t.addAPIProvider = st, t.addCollection = w, t.addIcon = x, t.buildIcon = T, t.calculateSize = C, t.default = Ie, t.disableCache = je, t.enableCache = Se, t.getIcon = j, t.getVersion = ye, t.iconExists = S, t.listIcons = y, t.loadIcon = Et, t.loadIcons = jt, t.observe = Jt, t.pauseObserver = Vt, t.renderHTML = ve, t.renderIcon = xe, t.renderSVG = be, t.replaceIDs = P, t.resumeObserver = Gt, t.scan = we, t.stopObserving = Bt, Object.defineProperty(t, "__esModule", { value: !0 }), t }({}); try { for (var key in exports.__esModule = !0, exports.default = Iconify, Iconify) exports[key] = Iconify[key]; } catch (t) { } try { void 0 === self.Iconify && (self.Iconify = Iconify); } catch (t) { }

    		/*! Indux Icons 1.0.0 - MIT License */

    		// Initialize plugin when either DOM is ready or Alpine is ready
    		function initializeIconPlugin() {
    		    // Register icon directive
    		    Alpine.directive('icon', (el, { expression }, { effect, evaluateLater }) => {
    		        const iconValue = expression;
    		        if (!iconValue) return

    		        // Check if it's a raw icon name
    		        const isRawIconName = !iconValue.includes("'") &&
    		            !iconValue.includes('"') &&
    		            !iconValue.includes('$') &&
    		            !iconValue.includes('?') &&
    		            !iconValue.includes('.');

    		        // For raw icon names, wrap in quotes
    		        const safeExpression = isRawIconName ? `'${iconValue}'` : iconValue;
    		        const evaluate = evaluateLater(safeExpression);

    		        effect(() => {
    		            evaluate(value => {
    		                if (!value) return

    		                // Special handling for <li> elements
    		                if (el.tagName.toLowerCase() === 'li') {
    		                    // Check if this is the first time processing this li
    		                    if (!el.hasAttribute('data-icon-processed')) {
    		                        // Store original text content
    		                        const originalText = el.textContent.trim();

    		                        // Clear the element
    		                        el.innerHTML = '';

    		                        // Create a temporary element for Iconify to process
    		                        const tempEl = document.createElement('span');
    		                        tempEl.className = 'iconify';
    		                        tempEl.setAttribute('data-icon', value);

    		                        // Add temporary element first
    		                        el.appendChild(tempEl);

    		                        // Add text content back
    		                        if (originalText) {
    		                            const textNode = document.createTextNode(originalText);
    		                            el.appendChild(textNode);
    		                        }

    		                        // Mark as processed to prevent re-processing
    		                        el.setAttribute('data-icon-processed', 'true');

    		                        // Use Iconify to process the temporary element
    		                        window.Iconify.scan(tempEl);

    		                        // After a short delay, check if Iconify replaced our element
    		                        setTimeout(() => {
    		                            // Check if the temp element was replaced by an SVG
    		                            const svg = el.querySelector('svg');
    		                            if (svg && svg.parentNode === el) {
    		                                // Iconify replaced our span with SVG, wrap it in a new span
    		                                const newSpan = document.createElement('span');
    		                                newSpan.setAttribute('x-icon', value);
    		                                el.insertBefore(newSpan, svg);
    		                                newSpan.appendChild(svg);
    		                            }
    		                        }, 50);
    		                        return
    		                    } else {
    		                        // Update existing icon
    		                        const iconSpan = el.querySelector('.iconify');
    		                        if (iconSpan) {
    		                            iconSpan.setAttribute('data-icon', value);
    		                            if (window.Iconify) {
    		                                window.Iconify.scan(iconSpan);
    		                            }
    		                        }
    		                        return
    		                    }
    		                }

    		                // Standard handling for non-li elements
    		                let iconEl = el.querySelector('.iconify');
    		                if (!iconEl) {
    		                    iconEl = document.createElement('span');
    		                    iconEl.className = 'iconify';
    		                    el.innerHTML = '';
    		                    el.appendChild(iconEl);
    		                }

    		                // Set icon data
    		                iconEl.setAttribute('data-icon', value);

    		                // Use Iconify (already embedded in script)
    		                window.Iconify.scan(iconEl);
    		            });
    		        });
    		    });
    		}

    		// Handle both DOMContentLoaded and alpine:init
    		if (document.readyState === 'loading') {
    		    document.addEventListener('DOMContentLoaded', () => {
    		        if (window.Alpine) initializeIconPlugin();
    		    });
    		}

    		document.addEventListener('alpine:init', initializeIconPlugin); 
    	} (indux_icons));
    	return indux_icons;
    }

    requireIndux_icons();

    /*! Indux Localization 1.0.0 - MIT License */

    function initializeLocalizationPlugin() {
        // Initialize empty localization store
        Alpine.store('locale', {
            current: 'en',
            available: [],
            direction: 'ltr',
            _initialized: false
        });

        // Get available locales from manifest
        async function getAvailableLocales() {
            try {
                const response = await fetch('/manifest.json');
                const manifest = await response.json();

                // Get unique locales from collections
                const locales = new Set(['en']); // Always include 'en' as fallback
                if (manifest.collections) {
                    Object.values(manifest.collections).forEach(collection => {
                        if (typeof collection === 'object') {
                            Object.keys(collection).forEach(key => {
                                if (key.length === 2) { // Assume 2-letter codes are locales
                                    locales.add(key);
                                }
                            });
                        }
                    });
                }

                return Array.from(locales);
            } catch (error) {
                console.error('[Indux] Error loading manifest:', error);
                return ['en']; // Fallback to just 'en'
            }
        }

        // Detect initial locale
        function detectInitialLocale(availableLocales) {
            // 1. Check HTML lang attribute
            const htmlLang = document.documentElement.lang;
            if (htmlLang && availableLocales.includes(htmlLang)) {
                return htmlLang;
            }

            // 2. Check URL path
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            if (pathParts[0] && availableLocales.includes(pathParts[0])) {
                return pathParts[0];
            }

            // 3. Check localStorage
            const storedLang = localStorage.getItem('lang');
            if (storedLang && availableLocales.includes(storedLang)) {
                return storedLang;
            }

            // 4. Check browser language
            const browserLang = navigator.language.split('-')[0];
            if (availableLocales.includes(browserLang)) {
                return browserLang;
            }

            // Default to first available locale
            return availableLocales[0];
        }

        // Update locale
        async function setLocale(newLang) {
            const store = Alpine.store('locale');
            if (!store.available.includes(newLang) || newLang === store.current) return;

            try {
                // Update store
                store.current = newLang;
                store._initialized = true;

                // Update HTML
                document.documentElement.lang = newLang;

                // Update localStorage
                localStorage.setItem('lang', newLang);

                // Update URL if needed
                const currentUrl = new URL(window.location.href);
                const pathParts = currentUrl.pathname.split('/').filter(Boolean);

                if (pathParts[0] && store.available.includes(pathParts[0])) {
                    // Replace language in path
                    pathParts[0] = newLang;
                    currentUrl.pathname = '/' + pathParts.join('/');
                    window.history.replaceState({}, '', currentUrl);
                }

                // Trigger locale change event
                window.dispatchEvent(new CustomEvent('localechange', {
                    detail: { locale: newLang }
                }));

            } catch (error) {
                console.error('[Indux] Error setting locale:', error);
                // Restore previous state
                store.current = localStorage.getItem('lang') || store.available[0];
                document.documentElement.lang = store.current;
            }
        }

        // Add $locale magic method
        Alpine.magic('locale', () => {
            const store = Alpine.store('locale');

            return new Proxy({}, {
                get(target, prop) {
                    if (prop === 'current') return store.current;
                    if (prop === 'available') return store.available;
                    if (prop === 'direction') return store.direction;
                    if (prop === 'set') return setLocale;
                    if (prop === 'toggle') {
                        return () => {
                            const currentIndex = store.available.indexOf(store.current);
                            const nextIndex = (currentIndex + 1) % store.available.length;
                            setLocale(store.available[nextIndex]);
                        };
                    }
                    return undefined;
                }
            });
        });

        // Initialize with manifest data
        (async () => {
            const availableLocales = await getAvailableLocales();
            const store = Alpine.store('locale');
            store.available = availableLocales;

            const initialLocale = detectInitialLocale(availableLocales);
            setLocale(initialLocale);
        })();
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeLocalizationPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeLocalizationPlugin);

    /*! Indux Resizer 1.0.0 - MIT License */

    function initializeResizablePlugin() {

        Alpine.directive('resizable', (el, { modifiers, expression }, { evaluate }) => {
            // Helper to parse value and unit from CSS dimension
            const parseDimension = (value) => {
                if (typeof value === 'number') return { value, unit: 'px' };
                const match = String(value).match(/^([\d.]+)(.*)$/);
                return match ? { value: parseFloat(match[1]), unit: match[2] || 'px' } : { value: 0, unit: 'px' };
            };

            // Helper to convert any unit to pixels
            const convertToPixels = (value, unit) => {
                if (unit === 'px') return value;

                // Create temporary element for conversion
                const temp = document.createElement('div');
                temp.style.visibility = 'hidden';
                temp.style.position = 'absolute';
                temp.style.width = `${value}${unit}`;
                document.body.appendChild(temp);

                const pixels = temp.getBoundingClientRect().width;
                document.body.removeChild(temp);

                return pixels;
            };

            // Helper to convert pixels back to original unit
            const convertFromPixels = (pixels, unit) => {
                if (unit === 'px') return pixels;

                // Create temporary element for conversion
                const temp = document.createElement('div');
                temp.style.visibility = 'hidden';
                temp.style.position = 'absolute';
                temp.style.width = '100px';  // Use 100px as reference
                document.body.appendChild(temp);

                const reference = temp.getBoundingClientRect().width;
                document.body.removeChild(temp);

                // Convert based on unit type
                switch (unit) {
                    case '%':
                        return (pixels / el.parentElement.getBoundingClientRect().width) * 100;
                    case 'rem':
                        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
                        return pixels / remSize;
                    case 'em':
                        const emSize = parseFloat(getComputedStyle(el).fontSize);
                        return pixels / emSize;
                    default:
                        return (pixels * 100) / reference;
                }
            };

            // Parse options from expression or use defaults
            const options = expression ? evaluate(expression) : {};
            const {
                minWidth = 200,
                maxWidth = Infinity,
                snapDistance = 50,
                snapPoints = [],
                snapCloseWidth = 200,
                toggle = null,
                handles = ['e'],
                saveWidth = null,
                affectedSelector = null
            } = options;

            // Parse constraints with units
            const constraints = {
                min: parseDimension(minWidth),
                max: parseDimension(maxWidth),
                close: parseDimension(snapCloseWidth)
            };

            // Parse snap points with units
            const parsedSnapPoints = snapPoints.map(point => parseDimension(point));

            // Load saved width if storage key provided
            if (saveWidth) {
                const savedWidth = localStorage.getItem(`resizable-${saveWidth}`);
                if (savedWidth) {
                    // Preserve the original unit if saved
                    const [value, unit] = savedWidth.split('|');
                    el.style.width = `${value}${unit || 'px'}`;
                }
            }

            // Handle mapping for cursor styles
            const handleMap = {
                n: { cursor: 'ns-resize', edge: 'top' },
                s: { cursor: 'ns-resize', edge: 'bottom' },
                e: { cursor: 'ew-resize', edge: 'right' },
                w: { cursor: 'ew-resize', edge: 'left' },
                nw: { cursor: 'nw-resize', edges: ['top', 'left'] },
                ne: { cursor: 'ne-resize', edges: ['top', 'right'] },
                sw: { cursor: 'sw-resize', edges: ['bottom', 'left'] },
                se: { cursor: 'se-resize', edges: ['bottom', 'right'] }
            };

            // Create resize handles
            handles.forEach(handlePos => {
                const handle = document.createElement('div');
                const handleInner = document.createElement('div');
                const handleInfo = handleMap[handlePos];

                handle.className = `resize-handle resize-handle-${handlePos}`;
                handleInner.className = 'resize-handle-inner';

                handle.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                cursor: ${handleInfo.cursor};
                z-index: 100;
            `;

                // Position the handle
                if (handlePos.includes('n')) handle.style.top = '-5px';
                if (handlePos.includes('s')) handle.style.bottom = '-5px';
                if (handlePos.includes('e')) handle.style.right = '-5px';
                if (handlePos.includes('w')) handle.style.left = '-5px';

                // Extend handle size for edges
                if (handlePos.length === 1) {
                    if (handlePos === 'n' || handlePos === 's') {
                        handle.style.width = 'calc(100% + 10px)';
                        handle.style.left = '-5px';
                    } else {
                        handle.style.height = 'calc(100% + 10px)';
                        handle.style.top = '-5px';
                    }
                }

                handle.appendChild(handleInner);

                let startX, startY, startWidth, startHeight;
                let currentSnap = null;

                // Convert constraints to pixels for calculations
                const pixelConstraints = {
                    min: convertToPixels(constraints.min.value, constraints.min.unit),
                    max: constraints.max.value === Infinity ? Infinity :
                        convertToPixels(constraints.max.value, constraints.max.unit),
                    close: convertToPixels(constraints.close.value, constraints.close.unit)
                };

                // Convert snap points to pixels
                const pixelSnapPoints = parsedSnapPoints.map(point => ({
                    value: convertToPixels(point.value, point.unit),
                    unit: point.unit
                }));

                const resize = (e) => {
                    e.preventDefault();

                    if (e.buttons === 0) {
                        stopResize();
                        return;
                    }

                    const deltaX = e.pageX - startX;
                    const deltaY = e.pageY - startY;

                    // Get affected element if specified
                    const affectedEl = affectedSelector ?
                        el.parentElement.querySelector(affectedSelector) : null;

                    // Calculate new dimensions
                    let newWidth = startWidth;
                    let newHeight = startHeight;

                    // Handle horizontal resizing
                    if (handlePos.includes('e')) {
                        newWidth = startWidth + deltaX;
                        if (affectedEl) {
                            const affectedWidth = affectedEl.getBoundingClientRect().width;
                            const affectedMinWidth = parseInt(getComputedStyle(affectedEl).minWidth) || 0;
                            if (affectedWidth - deltaX < affectedMinWidth) {
                                return;
                            }
                        }
                    } else if (handlePos.includes('w')) {
                        newWidth = startWidth - deltaX;
                        if (affectedEl) {
                            const affectedWidth = affectedEl.getBoundingClientRect().width;
                            const affectedMinWidth = parseInt(getComputedStyle(affectedEl).minWidth) || 0;
                            if (affectedWidth + deltaX < affectedMinWidth) {
                                return;
                            }
                        }
                    }

                    // Handle vertical resizing
                    if (handlePos.includes('s')) {
                        newHeight = startHeight + deltaY;
                    } else if (handlePos.includes('n')) {
                        newHeight = startHeight - deltaY;
                    }

                    const snapDistancePixels = convertToPixels(parseDimension(snapDistance).value,
                        parseDimension(snapDistance).unit);
                    const pullDistance = 50;
                    const closeThreshold = pixelConstraints.close - pullDistance;

                    // Handle snap-close before applying other constraints
                    if (newWidth < closeThreshold) {
                        el.classList.add('resizable-closing', 'resizable-closed');
                        currentSnap = 'closing';
                        if (toggle) {
                            evaluate(`${toggle} = false`);
                        }
                        return; // Exit early to prevent further width calculations
                    }

                    // Apply constraints only if we're not closing
                    newWidth = Math.min(Math.max(newWidth, pixelConstraints.min),
                        pixelConstraints.max === Infinity ? newWidth : pixelConstraints.max);

                    // Handle normal snap points
                    if (Math.abs(newWidth - pixelConstraints.min) < snapDistancePixels) {
                        newWidth = pixelConstraints.min;
                        currentSnap = 'min';
                    } else {
                        for (const point of pixelSnapPoints) {
                            if (Math.abs(newWidth - point.value) < snapDistancePixels) {
                                newWidth = point.value;
                                currentSnap = `${convertFromPixels(newWidth, point.unit)}${point.unit}`;
                                break;
                            }
                        }
                    }

                    // Convert back to original unit for display
                    const displayWidth = convertFromPixels(newWidth, constraints.min.unit);
                    el.style.width = `${displayWidth}${constraints.min.unit}`;
                    el.style.height = `${newHeight}px`;
                    el.classList.remove('resizable-closing', 'resizable-closed');
                    if (toggle) {
                        evaluate(`${toggle} = true`);
                    }

                    if (currentSnap !== 'closing' && saveWidth) {
                        localStorage.setItem(`resizable-${saveWidth}`,
                            `${displayWidth}|${constraints.min.unit}`);
                    }

                    // Dispatch resize event
                    el.dispatchEvent(new CustomEvent('resize', {
                        detail: {
                            width: convertFromPixels(newWidth, constraints.min.unit),
                            height: newHeight,
                            unit: constraints.min.unit,
                            snap: currentSnap,
                            closing: currentSnap === 'closing'
                        }
                    }));
                };

                // Create an overlay element (do this once when directive initializes)
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
                display: none;
                cursor: ew-resize;
            `;
                document.body.appendChild(overlay);

                const startResize = (e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();

                    document.body.style.userSelect = 'none';
                    document.body.style.webkitUserSelect = 'none';

                    // Show the overlay
                    overlay.style.display = 'block';

                    startX = e.pageX;
                    startY = e.pageY;
                    startWidth = el.getBoundingClientRect().width;
                    startHeight = el.getBoundingClientRect().height;

                    document.addEventListener('mousemove', resize, { passive: false });
                    document.addEventListener('mouseup', stopResize);
                };

                const stopResize = (e) => {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    document.body.style.userSelect = '';
                    document.body.style.webkitUserSelect = '';

                    // Hide the overlay
                    overlay.style.display = 'none';

                    document.removeEventListener('mousemove', resize);
                    document.removeEventListener('mouseup', stopResize);

                    if (toggle) {
                        evaluate(`${toggle} = ${!el.classList.contains('resizable-closed')}`);
                    }

                    currentSnap = null;
                };

                handle.addEventListener('mousedown', startResize);
                el.appendChild(handle);
            });

            // Ensure proper positioning context
            if (getComputedStyle(el).position === 'static') {
                el.style.position = 'relative';
            }
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeResizablePlugin();
        });
    }

    document.addEventListener('alpine:init', initializeResizablePlugin);

    /*! Indux Router 1.0.0 - MIT License */




    // Main routing initialization
    function initializeRouting() {

        // Mark as initialized
        window.__induxRoutingInitialized = true;
        window.dispatchEvent(new CustomEvent('indux:routing-ready'));

    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRouting);
    } else {
        initializeRouting();
    }

    // Export main routing interface
    window.InduxRouting = {
        initialize: initializeRouting,
        // Route matching utility
        matchesCondition: (path, condition) => {
            const normalizedPath = path.replace(/^\/+|\/+$/g, '') || '/';

            // Handle wildcards
            if (condition.includes('*')) {
                if (condition === '*') return true;
                const wildcardPattern = condition.replace('*', '');
                const normalizedPattern = wildcardPattern.replace(/^\/+|\/+$/g, '');
                return normalizedPath.startsWith(normalizedPattern + '/');
            }

            // Handle exact paths (starting with /)
            if (condition.startsWith('/')) {
                if (condition === '/') {
                    return normalizedPath === '/' || normalizedPath === '';
                }
                const routePath = condition.replace(/^\//, '');
                return normalizedPath === routePath || normalizedPath.startsWith(routePath + '/');
            }

            // Handle substring matching (default behavior)
            return normalizedPath.includes(condition);
        }
    };



    // Capture initial body order from index.html
    function captureBodyOrder() {
        if (window.__induxBodyOrder) return; // Already captured

        try {
            const req = new XMLHttpRequest();
            req.open('GET', '/index.html', false);
            req.send(null);
            if (req.status === 200) {
                let html = req.responseText;

                // Handle self-closing tags if components plugin isn't available
                if (!window.InduxComponents) {
                    html = html.replace(/<x-([a-z0-9-]+)([^>]*)\s*\/?>/gi, (match, tag, attrs) => `<x-${tag}${attrs}></x-${tag}>`);
                }

                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const bodyChildren = Array.from(doc.body.children);

                window.__induxBodyOrder = bodyChildren.map((el, index) => ({
                    index,
                    tag: el.tagName.toLowerCase().trim(),
                    isComponent: el.tagName.toLowerCase().startsWith('x-'),
                    attrs: Array.from(el.attributes).map(attr => [attr.name, attr.value]),
                    key: el.getAttribute('data-component-id') || (el.tagName.toLowerCase().startsWith('x-') ? el.tagName.toLowerCase().replace('x-', '').trim() : null),
                    position: index,
                    content: el.tagName.toLowerCase().startsWith('x-') ? null : el.innerHTML
                }));
            }
        } catch (e) {
            // Failed to load index.html for body order snapshot
        }
    }

    // Assign data-order attributes to all top-level elements
    function assignDataPositions() {
        if (!document.body) return;

        const bodyChildren = Array.from(document.body.children);

        bodyChildren.forEach((element, index) => {
            element.setAttribute('data-order', index.toString());
        });
    }

    // Initialize position management
    function initializePositionManagement() {
        // Capture body order first
        captureBodyOrder();

        // Assign data-order attributes
        assignDataPositions();
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePositionManagement);
    } else {
        initializePositionManagement();
    }

    // Export position management interface
    window.InduxRoutingPosition = {
        initialize: initializePositionManagement,
        captureBodyOrder,
        assignDataPositions
    }; 


    // Current route state
    let currentRoute = '/';
    let isInternalNavigation = false;

    // Handle route changes
    async function handleRouteChange() {
        const newRoute = window.location.pathname;
        if (newRoute === currentRoute) return;

        currentRoute = newRoute;

        // Emit route change event
        window.dispatchEvent(new CustomEvent('indux:route-change', {
            detail: {
                from: currentRoute,
                to: newRoute,
                normalizedPath: newRoute === '/' ? '/' : newRoute.replace(/^\/|\/$/g, '')
            }
        }));
    }

    // Intercept link clicks to prevent page reloads
    function interceptLinkClicks() {
        // Use capture phase to intercept before other handlers
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            // Check if it's a relative link
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) return; // External link
            } catch (e) {
                // Invalid URL, treat as relative
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Set flag to prevent recursive calls
            isInternalNavigation = true;

            // Update URL without page reload
            history.pushState(null, '', href);

            // Handle route change
            handleRouteChange();

            // Reset flag
            isInternalNavigation = false;

        }, true); // Use capture phase
    }

    // Initialize navigation
    function initializeNavigation() {
        // Set initial route
        currentRoute = window.location.pathname;

        // Intercept link clicks
        interceptLinkClicks();

        // Listen for popstate events (browser back/forward)
        window.addEventListener('popstate', () => {
            if (!isInternalNavigation) {
                handleRouteChange();
            }
        });

        // Handle initial route
        handleRouteChange();
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeNavigation);
    } else {
        initializeNavigation();
    }

    // Export navigation interface
    window.InduxRoutingNavigation = {
        initialize: initializeNavigation,
        getCurrentRoute: () => currentRoute
    }; 


    // Process visibility for all elements with x-route
    function processRouteVisibility(normalizedPath) {

        const routeElements = document.querySelectorAll('[x-route]');

        routeElements.forEach(element => {
            const routeCondition = element.getAttribute('x-route');
            if (!routeCondition) return;

            // Parse route conditions
            const conditions = routeCondition.split(',').map(cond => cond.trim());
            const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
            const negativeConditions = conditions
                .filter(cond => cond.startsWith('!'))
                .map(cond => cond.slice(1));

            // Check conditions
            const hasNegativeMatch = negativeConditions.some(cond =>
                window.InduxRouting.matchesCondition(normalizedPath, cond)
            );
            const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                window.InduxRouting.matchesCondition(normalizedPath, cond)
            );

            const shouldShow = hasPositiveMatch && !hasNegativeMatch;

            // Show/hide element
            if (shouldShow) {
                element.removeAttribute('hidden');
            } else {
                element.setAttribute('hidden', '');
            }
        });
    }

    // Initialize visibility management
    function initializeVisibility() {
        // Process initial visibility
        const currentPath = window.location.pathname;
        const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
        processRouteVisibility(normalizedPath);

        // Listen for route changes
        window.addEventListener('indux:route-change', (event) => {
            processRouteVisibility(event.detail.normalizedPath);
        });
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeVisibility);
    } else {
        initializeVisibility();
    }

    // Export visibility interface
    window.InduxRoutingVisibility = {
        initialize: initializeVisibility,
        processRouteVisibility
    }; 


    // Track injected head content to prevent duplicates
    const injectedHeadContent = new Set();

    // Check if an element should be visible based on route conditions
    function shouldElementBeVisible(element, normalizedPath) {

        // Check if element has x-route attribute
        if (element.hasAttribute('x-route')) {
            const routeCondition = element.getAttribute('x-route');

            if (routeCondition) {
                const conditions = routeCondition.split(',').map(cond => cond.trim());
                const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                const negativeConditions = conditions
                    .filter(cond => cond.startsWith('!'))
                    .map(cond => cond.slice(1));

                const hasNegativeMatch = negativeConditions.some(cond => {
                    const matches = window.InduxRouting.matchesCondition(normalizedPath, cond);
                    return matches;
                });

                const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => {
                    const matches = window.InduxRouting.matchesCondition(normalizedPath, cond);
                    return matches;
                });

                const result = hasPositiveMatch && !hasNegativeMatch;
                return result;
            }
        }

        // Check parent elements for x-route
        const parentWithRoute = element.closest('[x-route]');
        if (parentWithRoute) {
            return shouldElementBeVisible(parentWithRoute, normalizedPath);
        }

        // If no route conditions, element is visible
        return true;
    }

    // Generate unique identifier for head content
    function generateHeadId(element) {
        const position = element.getAttribute('data-order');
        const componentId = element.getAttribute('data-component-id');
        const tagName = element.tagName.toLowerCase();

        if (position) {
            return `${tagName}-${position}`;
        } else if (componentId) {
            return `${tagName}-${componentId}`;
        } else {
            return `${tagName}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }

    // Process head content for a single element
    function processElementHeadContent(element, normalizedPath) {
        let headTemplate = null;

        // Check if the element itself is a template with data-head
        if (element.tagName === 'TEMPLATE' && element.hasAttribute('data-head')) {
            headTemplate = element;
        } else {
            // Look for a template with data-head inside the element
            headTemplate = element.querySelector('template[data-head]');
        }

        if (!headTemplate) {
            return;
        }

        const headId = generateHeadId(element);
        const isVisible = shouldElementBeVisible(element, normalizedPath);

        if (isVisible) {
            // Check if we've already injected this content
            if (injectedHeadContent.has(headId)) {
                return;
            }

            // Add new head content
            Array.from(headTemplate.content.children).forEach(child => {
                if (child.tagName === 'SCRIPT') {
                    // For scripts, create and execute directly
                    const script = document.createElement('script');
                    script.textContent = child.textContent;
                    script.setAttribute('data-route-head', headId);
                    document.head.appendChild(script);
                } else {
                    // For other elements, clone and add
                    const clonedChild = child.cloneNode(true);
                    clonedChild.setAttribute('data-route-head', headId);
                    document.head.appendChild(clonedChild);
                }
            });

            injectedHeadContent.add(headId);
        } else {
            // Element is not visible, remove any existing head content for this element
            const existingHead = document.head.querySelectorAll(`[data-route-head="${headId}"]`);
            existingHead.forEach(el => {
                el.remove();
            });
            injectedHeadContent.delete(headId);
        }
    }

    // Process all head content in the DOM
    function processAllHeadContent(normalizedPath) {

        // Find all elements with head templates
        const elementsWithHead = document.querySelectorAll('template[data-head]');

        // Debug: Let's see what's actually in the DOM
        const allTemplates = document.querySelectorAll('template');
        allTemplates.forEach((template, index) => {
            if (template.hasAttribute('data-head')) ; else {
                // Check if this might be the about template
                if (template.getAttribute('x-route') === 'about') ;
            }
        });

        // Also try a more specific selector to see if we can find the about template
        document.querySelector('template[x-route="about"]');

        // Process each element's head content
        elementsWithHead.forEach((template, index) => {

            // For component templates, we need to check if the component should be visible
            // based on the current route, not just the template's own attributes
            let element = template;
            let shouldProcess = true;

            // If this is a component template (has data-component), check if the component
            // should be visible for the current route
            if (template.hasAttribute('data-component')) {
                template.getAttribute('data-component');
                const componentRoute = template.getAttribute('x-route');

                // Check if this component should be visible for the current route
                if (componentRoute) {
                    const isVisible = window.InduxRouting.matchesCondition(normalizedPath, componentRoute);
                    shouldProcess = isVisible;
                } else {
                    shouldProcess = false;
                }
            } else {
                // For non-component templates, use the existing logic
                element = template.closest('[data-order], [data-component-id], [x-route]');

                // If the template itself has the attributes we need, use it directly
                if (!element || element === template) {
                    if (template.hasAttribute('data-order') || template.hasAttribute('data-component') || template.hasAttribute('x-route')) {
                        element = template;
                    } else {
                        element = template.parentElement;
                    }
                }

                if (element) {
                    const isVisible = shouldElementBeVisible(element, normalizedPath);
                    shouldProcess = isVisible;
                }
            }

            if (shouldProcess) {
                // For component templates, process them directly since we've already determined visibility
                if (template.hasAttribute('data-component')) {
                    processElementHeadContent(template, normalizedPath);
                } else {
                    // For non-component templates, use the existing logic
                    processElementHeadContent(element, normalizedPath);
                }
            }
        });
    }

    // Initialize head content management
    function initializeHeadContent() {
        // Wait for components to be ready before processing head content
        function processHeadContentAfterComponentsReady() {
            // Process initial head content after a longer delay to let components settle
            setTimeout(() => {
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

                // Debug: Check if about component exists
                document.querySelector('[data-component="about-1"]');

                // Debug: Check what placeholders exist
                const placeholders = document.querySelectorAll('x-about, x-home, x-ui');
                placeholders.forEach((placeholder, index) => {
                });

                processAllHeadContent(normalizedPath);
            }, 200);
        }

        // Function to process head content immediately (for projects without components)
        function processHeadContentImmediately() {
            const currentPath = window.location.pathname;
            const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
            processAllHeadContent(normalizedPath);
        }

        // Check if components system exists
        if (window.InduxComponents) {
            // Components system exists - wait for it to be fully processed
            if (window.__induxComponentsInitialized) {
                // Components are initialized, but we need to wait for them to be processed
                // Check if components have already been processed
                if (document.querySelector('[data-component]')) {
                    processHeadContentAfterComponentsReady();
                } else {
                    // Wait for components to be processed
                    window.addEventListener('indux:components-processed', processHeadContentAfterComponentsReady);
                }
            } else {
                // Wait for components to be ready, then wait for them to be processed
                window.addEventListener('indux:components-ready', () => {
                    window.addEventListener('indux:components-processed', processHeadContentAfterComponentsReady);
                });
            }
        } else {
            // No components system - process immediately
            processHeadContentImmediately();
        }

        // Listen for route changes - process immediately after components are ready
        window.addEventListener('indux:route-change', (event) => {

            // Wait a bit for components to settle after route change
            setTimeout(() => {
                // Process head content immediately to catch components before they're reverted
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

                // Debug: Check if about component exists
                document.querySelector('[data-component="about-1"]');

                // Debug: Check what placeholders exist
                const placeholders = document.querySelectorAll('x-about, x-home, x-ui');
                placeholders.forEach((placeholder, index) => {
                });

                processAllHeadContent(normalizedPath);
            }, 100);
        });
    }

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHeadContent);
    } else {
        initializeHeadContent();
    }

    // Export head content interface
    window.InduxRoutingHead = {
        initialize: initializeHeadContent,
        processElementHeadContent,
        processAllHeadContent
    };

    /*! Indux Tabs 1.0.0 - MIT License */

    function initializeTabsPlugin() {   
        
        // Track tab data globally
        const tabData = new Map();
        
        // Helper to get tab property name based on panel set
        function getTabPropertyName(panelSet) {
            return panelSet ? `tab_${panelSet}` : 'tab';
        }
        
        // Helper to find panels by ID or class
        function findPanelsByTarget(target, panelSet) {
            const panels = [];
            
            // Check if target is an ID
            const panelById = document.getElementById(target);
            if (panelById && panelById.hasAttribute('x-tabpanel')) {
                const panelSetAttr = panelById.getAttribute('x-tabpanel');
                if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                    panels.push(panelById);
                }
            }
            
            // Check if target is a class - handle numeric class names
            try {
                const panelsByClass = document.querySelectorAll(`.${target}[x-tabpanel]`);
                panelsByClass.forEach(panel => {
                    const panelSetAttr = panel.getAttribute('x-tabpanel');
                    if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                        panels.push(panel);
                    } else {
                    }
                });
            } catch (e) {
                // If the selector is invalid (e.g., numeric class), try a different approach
                const allPanels = document.querySelectorAll('[x-tabpanel]');
                allPanels.forEach(panel => {
                    if (panel.classList.contains(target)) {
                        const panelSetAttr = panel.getAttribute('x-tabpanel');
                        if (panelSetAttr === panelSet || (!panelSetAttr && !panelSet)) {
                            panels.push(panel);
                        }
                    }
                });
            }
            
            return panels;
        }
        
        // Helper to find the common parent of multiple elements
        function findCommonParent(elements) {
            if (elements.length === 0) return document.body;
            if (elements.length === 1) return elements[0].parentElement || document.body;
            
            // Start with the first element's parent
            let commonParent = elements[0].parentElement;
            
            // For each element, find the lowest common ancestor
            for (let i = 1; i < elements.length; i++) {
                const element = elements[i];
                let currentParent = element.parentElement;
                
                // Walk up the tree until we find a common ancestor
                while (currentParent && !commonParent.contains(currentParent)) {
                    currentParent = currentParent.parentElement;
                }
                
                if (currentParent) {
                    commonParent = currentParent;
                }
            }
            
            // If we couldn't find a common parent, use body
            if (!commonParent) {
                commonParent = document.body;
            }
            
            return commonParent;
        }
        
        // Process tabs and panels
        function processTabs() {
            
            // Find all tab-related elements
            const tabButtons = document.querySelectorAll('[x-tab]');
            const panels = document.querySelectorAll('[x-tabpanel]');
            
            if (tabButtons.length === 0 && panels.length === 0) {
                return;
            }
            
            // Group panels by their panel set
            const panelSets = new Map();
            panels.forEach(panel => {
                const panelSet = panel.getAttribute('x-tabpanel') || '';
                if (!panelSets.has(panelSet)) {
                    panelSets.set(panelSet, []);
                }
                panelSets.get(panelSet).push(panel);
            });
            
            
            // Process each panel set separately
            panelSets.forEach((panelsInSet, panelSet) => {
                
                // Find buttons that control panels in this set
                const buttonsForThisSet = [];
                tabButtons.forEach(button => {
                    const tabValue = button.getAttribute('x-tab');
                    if (!tabValue) return;
                    
                    // Check if this button controls any panels in this set
                    const targetPanels = findPanelsByTarget(tabValue, panelSet);
                    if (targetPanels.length > 0) {
                        buttonsForThisSet.push(button);
                    }
                });
                
                if (buttonsForThisSet.length === 0) {
                    return;
                }
                
                // Find the common parent for this specific panel set
                const allElementsForThisSet = [...buttonsForThisSet, ...panelsInSet];
                const commonParent = findCommonParent(allElementsForThisSet);
                
                
                // Check if we've already processed this parent for this panel set
                const processedKey = `data-tabs-processed-${panelSet}`;
                if (commonParent.hasAttribute(processedKey)) {
                    return;
                }
                
                // Mark as processed for this panel set
                commonParent.setAttribute(processedKey, 'true');
                
                // Ensure the common parent has x-data
                if (!commonParent.hasAttribute('x-data')) {
                    commonParent.setAttribute('x-data', '{}');
                }
                
                // Get or create the tab data for this parent
                if (!tabData.has(commonParent)) {
                    tabData.set(commonParent, new Map());
                }
                const parentTabData = tabData.get(commonParent);
                
                // Process panels in this set
                panelsInSet.forEach(panel => {
                    const tabProp = getTabPropertyName(panelSet);
                    
                    // Add x-show directive
                    const panelId = panel.id || panel.className.split(' ')[0];
                    if (panelId) {
                        panel.setAttribute('x-show', `${tabProp} === '${panelId}'`);
                    }
                });
                
                // Process buttons for this set
                buttonsForThisSet.forEach(button => {
                    const tabValue = button.getAttribute('x-tab');
                    if (!tabValue) return;
                    
                    
                    const tabProp = getTabPropertyName(panelSet);
                    
                    
                    // Track this tab property
                    if (!parentTabData.has(tabProp)) {
                        parentTabData.set(tabProp, tabValue);
                    }
                    
                    // Add click handler
                    const existingClick = button.getAttribute('x-on:click') || '';
                    const newClick = `${tabProp} = '${tabValue}'`;
                    
                    // Only add if it's not already there to avoid duplication
                    let finalClick;
                    if (existingClick && existingClick.includes(newClick)) {
                        finalClick = existingClick;
                    } else {
                        finalClick = existingClick ? `${existingClick}; ${newClick}` : newClick;
                    }
                    
                    button.setAttribute('x-on:click', finalClick);
                });
                
                // Add tab properties to x-data for this panel set
                if (parentTabData.size > 0) {
                    const existingXData = commonParent.getAttribute('x-data') || '{}';
                    let newXData = existingXData;
                    
                    // Parse existing x-data
                    if (existingXData === '{}') {
                        // Empty x-data, create new one with tab properties
                        const tabProperties = Array.from(parentTabData.entries())
                            .map(([key, value]) => `${key}: '${value}'`)
                            .join(', ');
                        newXData = `{ ${tabProperties} }`;
                    } else {
                        // Existing x-data, append tab properties
                        const tabProperties = Array.from(parentTabData.entries())
                            .map(([key, value]) => `${key}: '${value}'`)
                            .join(', ');
                        
                        // Insert before the closing brace
                        const lastBraceIndex = existingXData.lastIndexOf('}');
                        if (lastBraceIndex > 0) {
                            const beforeBrace = existingXData.substring(0, lastBraceIndex);
                            const afterBrace = existingXData.substring(lastBraceIndex);
                            const separator = beforeBrace.trim().endsWith(',') ? '' : ', ';
                            newXData = beforeBrace + separator + tabProperties + afterBrace;
                        }
                    }
                    
                    // Update the x-data attribute
                    commonParent.setAttribute('x-data', newXData);
                    
                    // Force Alpine to re-initialize if it's already initialized
                    if (window.Alpine && commonParent._x_dataStack) {
                        delete commonParent._x_dataStack;
                        window.Alpine.initTree(commonParent);
                    }
                }
            });
        }
        
        // Register Alpine directives
        if (window.Alpine) {
            Alpine.plugin(() => {
                // Register x-tab directive
                Alpine.directive('tab', (el, { value }, { effect }) => {
                    // This will be processed by our main logic
                    effect(() => {
                        processTabs();
                    });
                });
                
                // Register x-tabpanel directive
                Alpine.directive('tabpanel', (el, { value }, { effect }) => {
                    // This will be processed by our main logic
                    effect(() => {
                        processTabs();
                    });
                });
            });
        } else {
            document.addEventListener('alpine:init', () => {
                Alpine.plugin(() => {
                    // Register x-tab directive
                    Alpine.directive('tab', (el, { value }, { effect }) => {
                        // This will be processed by our main logic
                        effect(() => {
                            processTabs();
                        });
                    });
                    
                    // Register x-tabpanel directive
                    Alpine.directive('tabpanel', (el, { value }, { effect }) => {
                        // This will be processed by our main logic
                        effect(() => {
                            processTabs();
                        });
                    });
                });
            });
        }
        
        // Process tabs when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processTabs);
        } else {
            processTabs();
        }
        
        // Also process when Alpine is ready
        document.addEventListener('alpine:initialized', processTabs);
    }

    // Initialize the plugin
    initializeTabsPlugin();

    /*! Indux Themes 1.0.0 - MIT License */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeThemePlugin() {

        // Initialize theme state with Alpine reactivity
        const theme = Alpine.reactive({
            current: localStorage.getItem('theme') || 'system'
        });

        // Apply initial theme
        applyTheme(theme.current);

        // Setup system theme listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (theme.current === 'system') {
                applyTheme('system');
            }
        });

        // Register theme directive
        Alpine.directive('theme', (el, { expression }, { evaluate, cleanup }) => {

            const handleClick = () => {
                const newTheme = expression === 'toggle'
                    ? (document.documentElement.classList.contains('dark') ? 'light' : 'dark')
                    : evaluate(expression);
                setTheme(newTheme);
            };

            el.addEventListener('click', handleClick);
            cleanup(() => el.removeEventListener('click', handleClick));
        });

        // Add $theme magic method
        Alpine.magic('theme', () => ({
            get current() {
                return theme.current
            },
            set current(value) {
                setTheme(value);
            }
        }));

        function setTheme(newTheme) {
            if (newTheme === 'toggle') {
                newTheme = theme.current === 'light' ? 'dark' : 'light';
            }

            // Update theme state
            theme.current = newTheme;
            localStorage.setItem('theme', newTheme);

            // Apply theme
            applyTheme(newTheme);
        }

        function applyTheme(theme) {
            const isDark = theme === 'system'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                : theme === 'dark';

            // Update document classes
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(isDark ? 'dark' : 'light');

            // Update meta theme-color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', isDark ? '#000000' : '#FFFFFF');
            }
        }
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) {
                initializeThemePlugin();
            }
        });
    }

    document.addEventListener('alpine:init', initializeThemePlugin);

    /*! Indux Toasts 1.0.0 - MIT License */

    const TOAST_DURATION = 3000; // Default duration in ms

    function initializeToastPlugin() {

        // Helper function to get or create container
        const getContainer = () => {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
            return container;
        };

        // Helper function to create icon element
        const createIconElement = (iconName) => {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'iconify';
            iconSpan.setAttribute('data-icon', iconName);
            if (window.Iconify) {
                window.Iconify.scan(iconSpan);
            }
            return iconSpan;
        };

        // Helper function to show toast
        const showToast = (message, { type = '', duration = TOAST_DURATION, dismissible = false, fixed = false, icon = null } = {}) => {
            const container = getContainer();

            // Create toast element
            const toast = document.createElement('div');
            toast.setAttribute('role', 'alert');
            toast.setAttribute('class', type ? `toast-${type}` : 'toast');

            // Create content with optional icon
            const contentHtml = `
            ${icon ? '<span class="toast-icon"></span>' : ''}
            <div class="toast-content">${message}</div>
            ${dismissible || fixed ? '<button class="toast-dismiss-button" aria-label="Dismiss">&times;</button>' : ''}
        `;

            toast.innerHTML = contentHtml;

            // Add icon if specified
            if (icon) {
                const iconContainer = toast.querySelector('.toast-icon');
                iconContainer.appendChild(createIconElement(icon));
            }

            // Add to container
            container.appendChild(toast);

            // Force a reflow before adding the entry class
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    toast.classList.add('toast-entry');
                });
            });

            // Handle dismiss button if present
            if (dismissible || fixed) {
                toast.querySelector('.toast-dismiss-button')?.addEventListener('click', () => {
                    removeToast(toast);
                });
            }

            // Auto dismiss after duration (unless fixed)
            if (!fixed) {
                const timeout = setTimeout(() => {
                    removeToast(toast);
                }, duration);

                // Pause timer on hover
                toast.addEventListener('mouseenter', () => {
                    clearTimeout(timeout);
                });

                // Resume timer on mouse leave
                toast.addEventListener('mouseleave', () => {
                    setTimeout(() => {
                        removeToast(toast);
                    }, duration / 2);
                });
            }
        };

        // Helper function to remove toast with animation
        const removeToast = (toast) => {
            toast.classList.remove('toast-entry');
            toast.classList.add('toast-exit');

            // Track all transitions
            let transitions = 0;
            const totalTransitions = 2; // opacity and transform

            toast.addEventListener('transitionend', (e) => {
                transitions++;
                // Only remove the toast after all transitions complete
                if (transitions >= totalTransitions) {
                    // Set height to 0 and opacity to 0 before removing
                    // This allows other toasts to smoothly animate to their new positions
                    toast.style.height = `${toast.offsetHeight}px`;
                    toast.offsetHeight; // Force reflow
                    toast.style.height = '0';
                    toast.style.margin = '0';
                    toast.style.padding = '0';

                    // Finally remove the element after the collapse animation
                    toast.addEventListener('transitionend', () => {
                        toast.remove();
                    }, { once: true });
                }
            });
        };

        // Add toast directive
        Alpine.directive('toast', (el, { modifiers, expression }, { evaluate }) => {
            // Parse options from modifiers
            const options = {
                type: modifiers.includes('success') ? 'success' :
                    modifiers.includes('error') ? 'error' : '',
                dismissible: modifiers.includes('dismiss'),
                fixed: modifiers.includes('fixed')
            };

            // Find duration modifier (any number)
            const durationModifier = modifiers.find(mod => !isNaN(mod));
            if (durationModifier) {
                options.duration = Number(durationModifier);
            } else {
                options.duration = modifiers.includes('long') ? TOAST_DURATION * 2 : TOAST_DURATION;
            }

            // Handle both static and dynamic expressions
            let message;
            try {
                // Check if expression contains any dynamic parts (+, `, or ${)
                if (expression.includes('+') || expression.includes('`') || expression.includes('${')) {
                    // Try to evaluate as a dynamic expression
                    message = evaluate(expression);
                } else {
                    // Use as static string
                    message = expression;
                }
            } catch (e) {
                // If evaluation fails, use the expression as a static string
                message = expression;
            }

            // Store the toast options on the element
            el._toastOptions = { message, options };

            // Add click handler that works with other handlers
            const originalClick = el.onclick;
            el.onclick = (e) => {
                // Call original click handler if it exists
                if (originalClick) {
                    originalClick.call(el, e);
                }
                // Show toast after original handler
                showToast(message, options);
            };
        });

        // Add toast magic to Alpine
        Alpine.magic('toast', () => {
            // Create the base toast function
            const toast = (message, options = {}) => {
                showToast(message, { ...options, type: '' });
            };

            // Add methods to the toast function
            toast.success = (message, options = {}) => {
                showToast(message, { ...options, type: 'success' });
            };

            toast.error = (message, options = {}) => {
                showToast(message, { ...options, type: 'error' });
            };

            // Add dismiss variants
            toast.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: '', dismissible: true });
            };

            toast.success.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: 'success', dismissible: true });
            };

            toast.error.dismiss = (message, options = {}) => {
                showToast(message, { ...options, type: 'error', dismissible: true });
            };

            // Add fixed variants
            toast.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: '', fixed: true });
            };

            toast.success.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: 'success', fixed: true });
            };

            toast.error.fixed = (message, options = {}) => {
                showToast(message, { ...options, type: 'error', fixed: true });
            };

            return toast;
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeToastPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeToastPlugin);

    /*! Indux Tooltips 1.0.0 - MIT License */

    const TOOLTIP_HOVER_DELAY = 500; // 500ms delay for hover tooltips

    function initializeTooltipPlugin() {

        Alpine.directive('tooltip', (el, { modifiers, expression }, { effect, evaluateLater }) => {

            let getTooltipContent;

            // If it starts with $x, handle content loading
            if (expression.startsWith('$x.')) {
                const path = expression.substring(3); // Remove '$x.'
                const [contentType, ...pathParts] = path.split('.');

                // Create evaluator that uses the content manager's path parsing
                getTooltipContent = evaluateLater(`
                (() => {
                    const store = $store.app;
                    if (!store.x['${contentType}']) return '';
                    
                    let current = store.x['${contentType}'];
                    ${pathParts.map(part => `
                        if (!current['${part}']) return '';
                        current = current['${part}'];
                    `).join('')}
                    return current || '';
                })()
            `);

                // Ensure content is loaded before showing tooltip
                effect(() => {
                    const store = Alpine.store('app');
                    if (!store.x[contentType]) {
                        store.contentManager.loadContentFile(store, contentType)
                            .then(content => {
                                if (content) {
                                    store.x[contentType] = content;
                                    Alpine.store('x', { ...store.x });
                                }
                            });
                    }
                });
            } else {
                // Check if expression contains any dynamic parts (+, `, or ${)
                if (expression.includes('+') || expression.includes('`') || expression.includes('${')) {
                    // Try to evaluate as a dynamic expression
                    getTooltipContent = evaluateLater(expression);
                } else {
                    // Use as static string
                    getTooltipContent = evaluateLater(`'${expression}'`);
                }
            }

            effect(() => {
                // Generate a unique ID for the tooltip
                const tooltipCode = Math.random().toString(36).substr(2, 9);
                const tooltipId = `tooltip-${tooltipCode}`;

                // Store the original popovertarget if it exists
                const originalTarget = el.getAttribute('popovertarget');

                // Create the tooltip element
                const tooltip = document.createElement('div');
                tooltip.setAttribute('popover', '');
                tooltip.setAttribute('id', tooltipId);
                tooltip.setAttribute('class', 'tooltip');

                // Store the original anchor name if it exists
                const originalAnchorName = el.style.getPropertyValue('anchor-name');
                const tooltipAnchor = `--tooltip-${tooltipCode}`;

                // Set tooltip content
                getTooltipContent(content => {
                    tooltip.innerHTML = content || '';
                });

                // Handle positioning modifiers
                const positions = modifiers.filter(mod => ['top', 'bottom', 'left', 'right'].includes(mod));
                if (positions.length > 0) {
                    tooltip.style.setProperty('position-area', positions.join(' '));
                }

                // Add the tooltip to the document
                document.body.appendChild(tooltip);

                // State variables for managing tooltip behavior
                let showTimeout;
                let isMouseDown = false;

                el.addEventListener('mouseenter', () => {
                    if (!isMouseDown) {
                        showTimeout = setTimeout(() => {
                            if (!isMouseDown && !tooltip.matches(':popover-open')) {
                                // Store original anchor name and set tooltip anchor
                                if (originalAnchorName) {
                                    el._originalAnchorName = originalAnchorName;
                                }
                                el.style.setProperty('anchor-name', tooltipAnchor);
                                tooltip.style.setProperty('position-anchor', tooltipAnchor);

                                el.setAttribute('popovertarget', tooltipId);
                                tooltip.showPopover();
                            }
                        }, TOOLTIP_HOVER_DELAY);
                    }
                });

                el.addEventListener('mouseleave', () => {
                    clearTimeout(showTimeout);
                    if (tooltip.matches(':popover-open')) {
                        tooltip.hidePopover();
                        // Restore original anchor name and target
                        if (el._originalAnchorName) {
                            el.style.setProperty('anchor-name', el._originalAnchorName);
                        }
                        if (originalTarget) {
                            el.setAttribute('popovertarget', originalTarget);
                        }
                    }
                });

                el.addEventListener('mousedown', () => {
                    isMouseDown = true;
                    clearTimeout(showTimeout);
                    if (tooltip.matches(':popover-open')) {
                        tooltip.hidePopover();
                    }
                    // Restore original anchor name and target
                    if (el._originalAnchorName) {
                        el.style.setProperty('anchor-name', el._originalAnchorName);
                    }
                    if (originalTarget) {
                        el.setAttribute('popovertarget', originalTarget);
                    }
                });

                el.addEventListener('mouseup', () => {
                    isMouseDown = false;
                });

                // Cleanup click handling
                el.addEventListener('click', (e) => {
                    clearTimeout(showTimeout);
                    if (tooltip.matches(':popover-open')) {
                        tooltip.hidePopover();
                    }
                    // Ensure original anchor name and target are restored
                    if (el._originalAnchorName) {
                        el.style.setProperty('anchor-name', el._originalAnchorName);
                    }
                    if (originalTarget) {
                        el.setAttribute('popovertarget', originalTarget);
                    }
                });
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeTooltipPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeTooltipPlugin);

    /*! Indux URL Queries 1.0.0 - MIT License */

    function initializeUrlQueriesPlugin() {
        // Initialize empty queries store
        Alpine.store('queries', {
            current: {},
            _initialized: false
        });

        // Cache for debounced updates
        const updateTimeouts = new Map();
        const DEBOUNCE_DELAY = 300;

        // Helper to parse query string
        function parseQueryString(queryString) {
            const params = new URLSearchParams(queryString);
            const result = {};

            for (const [key, value] of params.entries()) {
                // Handle array values (comma-separated)
                if (value.includes(',')) {
                    result[key] = value.split(',').filter(Boolean);
                } else {
                    result[key] = value;
                }
            }

            return result;
        }

        // Helper to stringify query object
        function stringifyQueryObject(query) {
            const params = new URLSearchParams();

            for (const [key, value] of Object.entries(query)) {
                if (Array.isArray(value)) {
                    params.set(key, value.filter(Boolean).join(','));
                } else if (value != null && value !== '') {
                    params.set(key, value);
                }
            }

            return params.toString();
        }

        // Helper to ensure value is in array format
        function ensureArray(value) {
            if (Array.isArray(value)) return value;
            if (value == null || value === '') return [];
            return [value];
        }

        // Update URL with new query parameters
        async function updateURL(updates, action = 'set') {

            const url = new URL(window.location.href);
            const currentParams = parseQueryString(url.search);

            // Apply updates based on action
            for (const [key, value] of Object.entries(updates)) {
                switch (action) {
                    case 'add':
                        const currentAdd = ensureArray(currentParams[key]);
                        const newValues = ensureArray(value);
                        currentParams[key] = [...new Set([...currentAdd, ...newValues])];
                        break;

                    case 'remove':
                        const currentRemove = ensureArray(currentParams[key]);
                        const removeValue = ensureArray(value)[0]; // Take first value to remove
                        currentParams[key] = currentRemove.filter(v => v !== removeValue);
                        if (currentParams[key].length === 0) {
                            delete currentParams[key];
                        }
                        break;

                    case 'set':
                    default:
                        if (value == null || value === '') {
                            delete currentParams[key];
                        } else {
                            currentParams[key] = value;
                        }
                        break;
                }
            }

            // Update URL
            const newQueryString = stringifyQueryObject(currentParams);
            url.search = newQueryString ? `?${newQueryString}` : '';
            console.debug('[Indux] New URL:', url.toString());

            // Update URL using pushState to ensure changes are visible
            window.history.pushState({}, '', url.toString());

            // Update store
            Alpine.store('queries', {
                current: currentParams,
                _initialized: true
            });

            // Dispatch event
            document.dispatchEvent(new CustomEvent('query-updated', {
                detail: { updates, action }
            }));

            return currentParams;
        }

        // Add $query magic method
        Alpine.magic('query', () => {
            const store = Alpine.store('queries');

            return new Proxy({}, {
                get(target, prop) {
                    // Handle special keys
                    if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
                        return undefined;
                    }

                    // Get current value
                    const value = store.current[prop];

                    // Return a proxy for the value
                    return new Proxy({}, {
                        get(target, key) {
                            if (key === 'value') return value;
                            if (key === 'set') return (newValue) => {
                                console.debug(`[Indux] Setting ${prop} to:`, newValue);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'set');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'add') return (newValue) => {
                                console.debug(`[Indux] Adding to ${prop}:`, newValue);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'add');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'remove') return (value) => {
                                console.debug(`[Indux] Removing from ${prop}:`, value);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: value }, 'remove');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'clear') return () => {
                                console.debug(`[Indux] Clearing ${prop}`);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: null }, 'set');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            return undefined;
                        }
                    });
                }
            });
        });

        // Initialize with current URL parameters
        const initialParams = parseQueryString(window.location.search);
        Alpine.store('queries', {
            current: initialParams,
            _initialized: true
        });

        // Listen for popstate events
        window.addEventListener('popstate', () => {
            const params = parseQueryString(window.location.search);
            console.debug('[Indux] Popstate params:', params);
            Alpine.store('queries', {
                current: params,
                _initialized: true
            });
        });
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeUrlQueriesPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeUrlQueriesPlugin);

    // Browser runtime compiler
    class TailwindCompiler {
        constructor(options = {}) {

            // Create style element immediately
            this.styleElement = document.createElement('style');
            this.styleElement.id = 'utility-styles';
            document.head.appendChild(this.styleElement);

            // Initialize properties
            this.tailwindLink = null;
            this.observer = null;
            this.isCompiling = false;
            this.compileTimeout = null;
            this.cache = new Map();
            this.lastThemeHash = null;
            this.processedElements = new WeakSet();
            this.activeBreakpoints = new Set();
            this.activeModifiers = new Set();
            this.cssFiles = new Set();
            this.pendingStyles = new Map();
            this.currentThemeVars = new Map();
            this.hasInitialized = false;
            this.lastCompileTime = 0;
            this.minCompileInterval = 100; // Minimum time between compilations in ms
            this.options = {
                rootSelector: options.rootSelector || ':root',
                themeSelector: options.themeSelector || '@theme',
                debounceTime: options.debounceTime || 50,
                maxCacheAge: options.maxCacheAge || 24 * 60 * 60 * 1000,
                debug: options.debug || true,
                ...options
            };

            // Pre-compile regex patterns
            this.regexPatterns = {
                root: new RegExp(`${this.options.rootSelector}\\s*{([^}]*)}`, 'g'),
                theme: new RegExp(`${this.options.themeSelector}\\s*{([^}]*)}`, 'g'),
                variable: /--([\w-]+):\s*([^;]+);/g,
                tailwindPrefix: /^(color|font|text|font-weight|tracking|leading|breakpoint|container|spacing|radius|shadow|inset-shadow|drop-shadow|blur|perspective|aspect|ease|animate|border-width|border-style|outline|outline-width|outline-style|ring|ring-offset|divide|accent|caret|decoration|placeholder|selection|scrollbar)-/
            };

            // Pre-define pseudo classes
            this.pseudoClasses = ['hover', 'focus', 'active', 'disabled', 'dark'];

            // Pre-define utility generators
            this.utilityGenerators = {
                'color-': (suffix, value) => {
                    const utilities = [];

                    // Helper function to generate utility with optional opacity
                    const addUtility = (prefix, property, baseValue) => {
                        // Base utility without opacity
                        utilities.push([`${prefix}-${suffix}`, `${property}: ${baseValue}`]);
                    };

                    addUtility('text', 'color', value);
                    addUtility('bg', 'background-color', value);
                    addUtility('border', 'border-color', value);
                    addUtility('fill', 'fill', value);
                    addUtility('stroke', 'stroke', value);

                    return utilities;
                },
                'font-': (suffix, value) => [
                    [`font-${suffix}`, `font-family: ${value}`]
                ],
                'text-': (suffix, value) => [
                    [`text-${suffix}`, `font-size: ${value}`]
                ],
                'font-weight-': (suffix, value) => [
                    [`font-${suffix}`, `font-weight: ${value}`]
                ],
                'tracking-': (suffix, value) => [
                    [`tracking-${suffix}`, `letter-spacing: ${value}`]
                ],
                'leading-': (suffix, value) => [
                    [`leading-${suffix}`, `line-height: ${value}`]
                ],
                'breakpoint-': (suffix, value) => [
                    [`@${suffix}`, `@media (min-width: ${value})`]
                ],
                'container-': (suffix, value) => [
                    [`container-${suffix}`, `max-width: ${value}`],
                    [`@container-${suffix}`, `@container (min-width: ${value})`]
                ],
                'spacing-': (suffix, value) => [
                    [`gap-${suffix}`, `gap: ${value}`],
                    [`p-${suffix}`, `padding: ${value}`],
                    [`px-${suffix}`, `padding-left: ${value}; padding-right: ${value}`],
                    [`py-${suffix}`, `padding-top: ${value}; padding-bottom: ${value}`],
                    [`m-${suffix}`, `margin: ${value}`],
                    [`mx-${suffix}`, `margin-left: ${value}; margin-right: ${value}`],
                    [`my-${suffix}`, `margin-top: ${value}; margin-bottom: ${value}`],
                    [`space-x-${suffix}`, `> * + * { margin-left: ${value}; }`],
                    [`space-y-${suffix}`, `> * + * { margin-top: ${value}; }`],
                    [`max-w-${suffix}`, `max-width: ${value}`],
                    [`max-h-${suffix}`, `max-height: ${value}`],
                    [`min-w-${suffix}`, `min-width: ${value}`],
                    [`min-h-${suffix}`, `min-height: ${value}`],
                    [`w-${suffix}`, `width: ${value}`],
                    [`h-${suffix}`, `height: ${value}`]
                ],
                'radius-': (suffix, value) => [
                    [`rounded-${suffix}`, `border-radius: ${value}`]
                ],
                'shadow-': (suffix, value) => [
                    [`shadow-${suffix}`, `box-shadow: ${value}`]
                ],
                'inset-shadow-': (suffix, value) => [
                    [`inset-shadow-${suffix}`, `box-shadow: inset ${value}`]
                ],
                'drop-shadow-': (suffix, value) => [
                    [`drop-shadow-${suffix}`, `filter: drop-shadow(${value})`]
                ],
                'blur-': (suffix, value) => [
                    [`blur-${suffix}`, `filter: blur(${value})`]
                ],
                'perspective-': (suffix, value) => [
                    [`perspective-${suffix}`, `perspective: ${value}`]
                ],
                'aspect-': (suffix, value) => [
                    [`aspect-${suffix}`, `aspect-ratio: ${value}`]
                ],
                'ease-': (suffix, value) => [
                    [`ease-${suffix}`, `transition-timing-function: ${value}`]
                ],
                'animate-': (suffix, value) => [
                    [`animate-${suffix}`, `animation: ${value}`]
                ],
                'border-width-': (suffix, value) => [
                    [`border-${suffix}`, `border-width: ${value}`]
                ],
                'border-style-': (suffix, value) => [
                    [`border-${suffix}`, `border-style: ${value}`]
                ],
                'outline-': (suffix, value) => [
                    [`outline-${suffix}`, `outline-color: ${value}`]
                ],
                'outline-width-': (suffix, value) => [
                    [`outline-${suffix}`, `outline-width: ${value}`]
                ],
                'outline-style-': (suffix, value) => [
                    [`outline-${suffix}`, `outline-style: ${value}`]
                ],
                'ring-': (suffix, value) => [
                    [`ring-${suffix}`, `box-shadow: 0 0 0 ${value} var(--color-ring)`]
                ],
                'ring-offset-': (suffix, value) => [
                    [`ring-offset-${suffix}`, `--tw-ring-offset-width: ${value}`]
                ],
                'divide-': (suffix, value) => [
                    [`divide-${suffix}`, `border-color: ${value}`]
                ],
                'accent-': (suffix, value) => [
                    [`accent-${suffix}`, `accent-color: ${value}`]
                ],
                'caret-': (suffix, value) => [
                    [`caret-${suffix}`, `caret-color: ${value}`]
                ],
                'decoration-': (suffix, value) => [
                    [`decoration-${suffix}`, `text-decoration-color: ${value}`]
                ],
                'placeholder-': (suffix, value) => [
                    [`placeholder-${suffix}`, `&::placeholder { color: ${value} }`]
                ],
                'selection-': (suffix, value) => [
                    [`selection-${suffix}`, `&::selection { background-color: ${value} }`]
                ],
                'scrollbar-': (suffix, value) => [
                    [`scrollbar-${suffix}`, `scrollbar-color: ${value}`]
                ]
            };

            // Define valid variants and their CSS selectors
            this.variants = {
                // State variants
                'hover': ':hover',
                'focus': ':focus',
                'focus-visible': ':focus-visible',
                'focus-within': ':focus-within',
                'active': ':active',
                'visited': ':visited',
                'target': ':target',
                'first': ':first-child',
                'last': ':last-child',
                'only': ':only-child',
                'odd': ':nth-child(odd)',
                'even': ':nth-child(even)',
                'first-of-type': ':first-of-type',
                'last-of-type': ':last-of-type',
                'only-of-type': ':only-of-type',
                'empty': ':empty',
                'disabled': ':disabled',
                'enabled': ':enabled',
                'checked': ':checked',
                'indeterminate': ':indeterminate',
                'default': ':default',
                'required': ':required',
                'valid': ':valid',
                'invalid': ':invalid',
                'in-range': ':in-range',
                'out-of-range': ':out-of-range',
                'placeholder-shown': ':placeholder-shown',
                'autofill': ':autofill',
                'read-only': ':read-only',
                'read-write': ':read-write',
                'optional': ':optional',
                'user-valid': ':user-valid',
                'user-invalid': ':user-invalid',
                'open': '[open] &',
                'closed': ':not([open]) &',
                'paused': '[data-state="paused"] &',
                'playing': '[data-state="playing"] &',
                'muted': '[data-state="muted"] &',
                'unmuted': '[data-state="unmuted"] &',
                'collapsed': '[data-state="collapsed"] &',
                'expanded': '[data-state="expanded"] &',
                'unchecked': ':not(:checked)',
                'selected': '[data-state="selected"] &',
                'unselected': '[data-state="unselected"] &',
                'details-content': '::details-content',
                'nth': ':nth-child',
                'nth-last': ':nth-last-child',
                'nth-of-type': ':nth-of-type',
                'nth-last-of-type': ':nth-last-of-type',
                'has': ':has',
                'not': ':not',

                // Pseudo-elements
                'before': '::before',
                'after': '::after',
                'first-letter': '::first-letter',
                'first-line': '::first-line',
                'marker': '::marker',
                'selection': '::selection',
                'file': '::file-selector-button',
                'backdrop': '::backdrop',
                'placeholder': '::placeholder',
                'target-text': '::target-text',
                'spelling-error': '::spelling-error',
                'grammar-error': '::grammar-error',

                // Media queries
                'dark': '.dark &',
                'light': '.light &',

                // Group variants
                'group': '.group &',
                'group-hover': '.group:hover &',
                'group-focus': '.group:focus &',
                'group-focus-within': '.group:focus-within &',
                'group-active': '.group:active &',
                'group-disabled': '.group:disabled &',
                'group-visited': '.group:visited &',
                'group-checked': '.group:checked &',
                'group-required': '.group:required &',
                'group-valid': '.group:valid &',
                'group-invalid': '.group:invalid &',
                'group-in-range': '.group:in-range &',
                'group-out-of-range': '.group:out-of-range &',
                'group-placeholder-shown': '.group:placeholder-shown &',
                'group-autofill': '.group:autofill &',
                'group-read-only': '.group:read-only &',
                'group-read-write': '.group:read-write &',
                'group-optional': '.group:optional &',
                'group-user-valid': '.group:user-valid &',
                'group-user-invalid': '.group:user-invalid &',

                // Peer variants
                'peer': '.peer ~ &',
                'peer-hover': '.peer:hover ~ &',
                'peer-focus': '.peer:focus ~ &',
                'peer-focus-within': '.peer:focus-within ~ &',
                'peer-active': '.peer:active ~ &',
                'peer-disabled': '.peer:disabled ~ &',
                'peer-visited': '.peer:visited ~ &',
                'peer-checked': '.peer:checked ~ &',
                'peer-required': '.peer:required ~ &',
                'peer-valid': '.peer:valid ~ &',
                'peer-invalid': '.peer:invalid ~ &',
                'peer-in-range': '.peer:in-range ~ &',
                'peer-out-of-range': '.peer:out-of-range ~ &',
                'peer-placeholder-shown': '.peer:placeholder-shown ~ &',
                'peer-autofill': '.peer:autofill ~ &',
                'peer-read-only': '.peer:read-only ~ &',
                'peer-read-write': '.peer:read-write ~ &',
                'peer-optional': '.peer:optional ~ &',
                'peer-user-valid': '.peer:user-valid ~ &',
                'peer-user-invalid': '.peer:user-invalid &',

                'motion-safe': '@media (prefers-reduced-motion: no-preference)',
                'motion-reduce': '@media (prefers-reduced-motion: reduce)',
                'print': '@media print',
                'portrait': '@media (orientation: portrait)',
                'landscape': '@media (orientation: landscape)',
                'contrast-more': '@media (prefers-contrast: more)',
                'contrast-less': '@media (prefers-contrast: less)',
                'forced-colors': '@media (forced-colors: active)',
                'rtl': '&:where(:dir(rtl), [dir="rtl"], [dir="rtl"] *)',
                'ltr': '&:where(:dir(ltr), [dir="ltr"], [dir="ltr"] *)',
                'pointer-fine': '@media (pointer: fine)',
                'pointer-coarse': '@media (pointer: coarse)',
                'pointer-none': '@media (pointer: none)',
                'any-pointer-fine': '@media (any-pointer: fine)',
                'any-pointer-coarse': '@media (any-pointer: coarse)',
                'any-pointer-none': '@media (any-pointer: none)',
                'scripting-enabled': '@media (scripting: enabled)',
                'can-hover': '@media (hover: hover)',
                'can-not-hover': '@media (hover: none)',
                'any-hover': '@media (any-hover: hover)',
                'any-hover-none': '@media (any-hover: none)',
                'any-pointer': '@media (any-pointer: fine)',
                'any-pointer-coarse': '@media (any-pointer: coarse)',
                'any-pointer-none': '@media (any-pointer: none)',
                'color': '@media (color)',
                'color-gamut': '@media (color-gamut: srgb)',
                'color-gamut-p3': '@media (color-gamut: p3)',
                'color-gamut-rec2020': '@media (color-gamut: rec2020)',
                'monochrome': '@media (monochrome)',
                'monochrome-color': '@media (monochrome: 0)',
                'monochrome-grayscale': '@media (monochrome: 1)',
                'inverted-colors': '@media (inverted-colors: inverted)',
                'inverted-colors-none': '@media (inverted-colors: none)',
                'update': '@media (update: fast)',
                'update-slow': '@media (update: slow)',
                'update-none': '@media (update: none)',
                'overflow-block': '@media (overflow-block: scroll)',
                'overflow-block-paged': '@media (overflow-block: paged)',
                'overflow-inline': '@media (overflow-inline: scroll)',
                'overflow-inline-auto': '@media (overflow-inline: auto)',
                'prefers-color-scheme': '@media (prefers-color-scheme: dark)',
                'prefers-color-scheme-light': '@media (prefers-color-scheme: light)',
                'prefers-contrast': '@media (prefers-contrast: more)',
                'prefers-contrast-less': '@media (prefers-contrast: less)',
                'prefers-contrast-no-preference': '@media (prefers-contrast: no-preference)',
                'prefers-reduced-motion': '@media (prefers-reduced-motion: reduce)',
                'prefers-reduced-motion-no-preference': '@media (prefers-reduced-motion: no-preference)',
                'prefers-reduced-transparency': '@media (prefers-reduced-transparency: reduce)',
                'prefers-reduced-transparency-no-preference': '@media (prefers-reduced-transparency: no-preference)',
                'resolution': '@media (resolution: 1dppx)',
                'resolution-low': '@media (resolution: 1dppx)',
                'resolution-high': '@media (resolution: 2dppx)',
                'scan': '@media (scan: progressive)',
                'scan-interlace': '@media (scan: interlace)',
                'scripting': '@media (scripting: enabled)',
                'scripting-none': '@media (scripting: none)',
                'scripting-initial-only': '@media (scripting: initial-only)',

                // Container queries
                'container': '@container',
                'container-name': '@container',

                // Important modifier
                '!': '!important',

                // Responsive breakpoints
                'sm': '@media (min-width: 640px)',
                'md': '@media (min-width: 768px)',
                'lg': '@media (min-width: 1024px)',
                'xl': '@media (min-width: 1280px)',
                '2xl': '@media (min-width: 1536px)',

                // Supports queries
                'supports': '@supports',

                // Starting style
                'starting': '@starting-style',

                // Data attribute variants (common patterns)
                'data-open': '[data-state="open"] &',
                'data-closed': '[data-state="closed"] &',
                'data-checked': '[data-state="checked"] &',
                'data-unchecked': '[data-state="unchecked"] &',
                'data-on': '[data-state="on"] &',
                'data-off': '[data-state="off"] &',
                'data-visible': '[data-state="visible"] &',
                'data-hidden': '[data-state="hidden"] &',
                'data-disabled': '[data-disabled] &',
                'data-loading': '[data-loading] &',
                'data-error': '[data-error] &',
                'data-success': '[data-success] &',
                'data-warning': '[data-warning] &',
                'data-selected': '[data-selected] &',
                'data-highlighted': '[data-highlighted] &',
                'data-pressed': '[data-pressed] &',
                'data-expanded': '[data-expanded] &',
                'data-collapsed': '[data-collapsed] &',
                'data-active': '[data-active] &',
                'data-inactive': '[data-inactive] &',
                'data-valid': '[data-valid] &',
                'data-invalid': '[data-invalid] &',
                'data-required': '[data-required] &',
                'data-optional': '[data-optional] &',
                'data-readonly': '[data-readonly] &',
                'data-write': '[data-write] &',

                // Aria attribute variants (common patterns)
                'aria-expanded': '[aria-expanded="true"] &',
                'aria-collapsed': '[aria-expanded="false"] &',
                'aria-pressed': '[aria-pressed="true"] &',
                'aria-unpressed': '[aria-pressed="false"] &',
                'aria-checked': '[aria-checked="true"] &',
                'aria-unchecked': '[aria-checked="false"] &',
                'aria-selected': '[aria-selected="true"] &',
                'aria-unselected': '[aria-selected="false"] &',
                'aria-invalid': '[aria-invalid="true"] &',
                'aria-valid': '[aria-invalid="false"] &',
                'aria-required': '[aria-required="true"] &',
                'aria-optional': '[aria-required="false"] &',
                'aria-disabled': '[aria-disabled="true"] &',
                'aria-enabled': '[aria-disabled="false"] &',
                'aria-hidden': '[aria-hidden="true"] &',
                'aria-visible': '[aria-hidden="false"] &',
                'aria-busy': '[aria-busy="true"] &',
                'aria-available': '[aria-busy="false"] &',
                'aria-current': '[aria-current="true"] &',
                'aria-not-current': '[aria-current="false"] &',
                'aria-live': '[aria-live="polite"] &, [aria-live="assertive"] &',
                'aria-atomic': '[aria-atomic="true"] &',
                'aria-relevant': '[aria-relevant="additions"] &, [aria-relevant="removals"] &, [aria-relevant="text"] &, [aria-relevant="all"] &'
            };

            // Define variant groups that can be combined
            this.variantGroups = {
                'state': ['hover', 'focus', 'active', 'visited', 'target', 'open', 'closed', 'paused', 'playing', 'muted', 'unmuted', 'collapsed', 'expanded', 'unchecked', 'selected', 'unselected'],
                'child': ['first', 'last', 'only', 'odd', 'even'],
                'form': ['disabled', 'enabled', 'checked', 'indeterminate', 'required', 'valid', 'invalid'],
                'pseudo': ['before', 'after', 'first-letter', 'first-line', 'marker', 'selection', 'file', 'backdrop'],
                'media': ['dark', 'light', 'motion-safe', 'motion-reduce', 'print', 'portrait', 'landscape', 'rtl', 'ltr', 'can-hover', 'can-not-hover', 'any-hover', 'any-hover-none', 'color', 'monochrome', 'inverted-colors', 'inverted-colors-none', 'update', 'update-slow', 'update-none', 'overflow-block', 'overflow-block-paged', 'overflow-inline', 'overflow-inline-auto', 'prefers-color-scheme', 'prefers-color-scheme-light', 'prefers-contrast', 'prefers-contrast-less', 'prefers-contrast-no-preference', 'prefers-reduced-motion', 'prefers-reduced-motion-no-preference', 'prefers-reduced-transparency', 'prefers-reduced-transparency-no-preference', 'resolution', 'resolution-low', 'resolution-high', 'scan', 'scan-interlace', 'scripting', 'scripting-none', 'scripting-initial-only', 'forced-colors', 'contrast-more', 'contrast-less', 'pointer-fine', 'pointer-coarse', 'pointer-none', 'any-pointer-fine', 'any-pointer-coarse', 'any-pointer-none', 'scripting-enabled'],
                'responsive': ['sm', 'md', 'lg', 'xl', '2xl'],
                'group': ['group', 'group-hover', 'group-focus', 'group-active', 'group-disabled', 'group-checked', 'group-required', 'group-valid', 'group-invalid'],
                'peer': ['peer', 'peer-hover', 'peer-focus', 'peer-active', 'peer-disabled', 'peer-checked', 'peer-required', 'peer-valid', 'peer-invalid'],
                'data': ['data-open', 'data-closed', 'data-checked', 'data-unchecked', 'data-visible', 'data-hidden', 'data-disabled', 'data-loading', 'data-error', 'data-success', 'data-warning', 'data-selected', 'data-highlighted', 'data-pressed', 'data-expanded', 'data-collapsed', 'data-active', 'data-inactive', 'data-valid', 'data-invalid', 'data-required', 'data-optional', 'data-readonly', 'data-write'],
                'aria': ['aria-expanded', 'aria-collapsed', 'aria-pressed', 'aria-unpressed', 'aria-checked', 'aria-unchecked', 'aria-selected', 'aria-unselected', 'aria-invalid', 'aria-valid', 'aria-required', 'aria-optional', 'aria-disabled', 'aria-enabled', 'aria-hidden', 'aria-visible', 'aria-busy', 'aria-available', 'aria-current', 'aria-not-current', 'aria-live', 'aria-atomic', 'aria-relevant']
            };

            // Cache for parsed class names
            this.classCache = new Map();

            // Load cache and start processing
            this.loadAndApplyCache();

            // Listen for component loads
            this.setupComponentLoadListener();

            this.waitForTailwind().then(() => {
                this.startProcessing();
            });
        }

        setupComponentLoadListener() {
            // Use a single debounced handler for all component-related events
            const debouncedCompile = this.debounce(() => {
                if (!this.isCompiling) {
                    this.compile();
                }
            }, this.options.debounceTime);

            // Listen for custom event when components are loaded
            document.addEventListener('indux:component-loaded', (event) => {
                debouncedCompile();
            });

            // Use a single MutationObserver for all DOM changes
            const observer = new MutationObserver((mutations) => {
                let shouldRecompile = false;

                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE &&
                                (node.hasAttribute('data-component') ||
                                    node.querySelector('[data-component]'))) {
                                shouldRecompile = true;
                                break;
                            }
                        }
                    }
                    if (shouldRecompile) break;
                }

                if (shouldRecompile) {
                    debouncedCompile();
                }
            });

            // Start observing the document with the configured parameters
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }

        // Debounce helper
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Wait for Tailwind to be available
        async waitForTailwind() {
            // Check if Tailwind is already available
            if (this.isTailwindAvailable()) {
                return;
            }

            // Wait for Tailwind to be available
            return new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (this.isTailwindAvailable()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);

                // Also check on DOMContentLoaded
                document.addEventListener('DOMContentLoaded', () => {
                    if (this.isTailwindAvailable()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                });

                // Set a timeout to prevent infinite waiting
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('[TailwindCompiler] Tailwind not found after 5 seconds, proceeding anyway');
                    resolve();
                }, 5000);
            });
        }

        // Check if Tailwind is available
        isTailwindAvailable() {
            // Check for Tailwind in various ways
            return (
                // Check for Tailwind CSS file
                Array.from(document.styleSheets).some(sheet =>
                    sheet.href && (
                        sheet.href.includes('tailwind') ||
                        sheet.href.includes('tailwindcss')
                    )
                ) ||
                // Check for Tailwind classes in document
                document.querySelector('[class*="tailwind"]') ||
                // Check for Tailwind in window object
                window.tailwind ||
                // Check for Tailwind in document head
                document.head.innerHTML.includes('tailwind')
            );
        }

        loadAndApplyCache() {
            try {
                const cached = localStorage.getItem('tailwind-cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    this.cache = new Map(Object.entries(parsed));

                    // Apply the most recent cached styles immediately
                    const mostRecentCache = Array.from(this.cache.entries())
                        .sort((a, b) => b[1].timestamp - a[1].timestamp)[0];

                    if (mostRecentCache) {
                        this.styleElement.textContent = mostRecentCache[1].css;
                        this.lastThemeHash = mostRecentCache[1].themeHash;
                    }
                }
            } catch (error) {
                console.warn('Failed to load cached styles:', error);
            }
        }

        async startProcessing() {
            try {

                // Start initial compilation immediately
                const initialCompilation = this.compile();

                // Set up observer while compilation is running
                this.observer = new MutationObserver((mutations) => {
                    const relevantMutations = mutations.filter(mutation => {
                        if (mutation.type === 'attributes' &&
                            mutation.attributeName === 'class') {
                            return true;
                        }
                        if (mutation.type === 'childList') {
                            return Array.from(mutation.addedNodes).some(node =>
                                node.nodeType === Node.ELEMENT_NODE);
                        }
                        return false;
                    });

                    if (relevantMutations.length === 0) return;

                    // Check if there are any new classes that need processing
                    const newClasses = this.getUsedClasses();
                    if (newClasses.classes.length === 0) return;

                    if (this.compileTimeout) {
                        clearTimeout(this.compileTimeout);
                    }
                    this.compileTimeout = setTimeout(() => {
                        if (!this.isCompiling) {
                            this.compile();
                        }
                    }, this.options.debounceTime);
                });

                // Start observing immediately
                this.observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
                });

                // Wait for initial compilation
                await initialCompilation;

                this.hasInitialized = true;
            } catch (error) {
                console.error('Error starting Tailwind compiler:', error);
            }
        }

        discoverCssFiles() {
            try {
                // Get all stylesheets from the document
                const stylesheets = Array.from(document.styleSheets);

                // Process each stylesheet
                for (const sheet of stylesheets) {
                    try {
                        // Only process local files
                        if (sheet.href && sheet.href.startsWith(window.location.origin)) {
                            this.cssFiles.add(sheet.href);
                        }

                        // Get all @import rules
                        const rules = Array.from(sheet.cssRules || []);
                        for (const rule of rules) {
                            if (rule.type === CSSRule.IMPORT_RULE &&
                                rule.href.startsWith(window.location.origin)) {
                                this.cssFiles.add(rule.href);
                            }
                        }
                    } catch (e) {
                        // Skip stylesheets that can't be accessed due to CORS
                        console.warn('Skipped stylesheet due to CORS:', sheet.href || 'inline');
                    }
                }

                // Add any inline styles
                const styleElements = document.querySelectorAll('style');
                for (const style of styleElements) {
                    if (style.textContent) {
                        const id = style.id || 'inline-style';
                        this.cssFiles.add('inline:' + id);
                    }
                }
            } catch (error) {
                console.warn('Error discovering CSS files:', error);
            }
        }

        loadPersistentCache() {
            try {
                const cached = localStorage.getItem('tailwind-cache');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    this.cache = new Map(Object.entries(parsed));
                }
            } catch (error) {
                console.warn('Failed to load cached styles:', error);
            }
        }

        savePersistentCache() {
            try {
                const serialized = JSON.stringify(Object.fromEntries(this.cache));
                localStorage.setItem('tailwind-cache', serialized);
            } catch (error) {
                console.warn('Failed to save cached styles:', error);
            }
        }

        // Generate a hash of the theme variables to detect changes
        generateThemeHash(themeCss) {
            // Use encodeURIComponent to handle non-Latin1 characters safely
            return encodeURIComponent(themeCss).slice(0, 8); // Simple hash of theme content
        }

        // Clean up old cache entries
        cleanupCache() {
            const now = Date.now();
            const maxAge = this.options.maxCacheAge;
            const entriesToDelete = [];

            for (const [key, value] of this.cache.entries()) {
                if (value.timestamp && (now - value.timestamp > maxAge)) {
                    entriesToDelete.push(key);
                }
            }

            for (const key of entriesToDelete) {
                this.cache.delete(key);
            }

            if (entriesToDelete.length > 0) {
                this.savePersistentCache();
            }
        }

        getUsedClasses() {
            try {
                const usedClasses = new Set();
                const usedVariableSuffixes = new Set();

                // Scan current DOM (including index.html and all loaded components)
                const elements = document.getElementsByTagName('*');
                for (const element of elements) {
                    let classes = [];
                    if (typeof element.className === 'string') {
                        classes = element.className.split(/\s+/).filter(Boolean);
                    } else if (element.classList) {
                        classes = Array.from(element.classList);
                    }

                    for (const cls of classes) {
                        if (!cls) continue;

                        // Add the full class name (including variants)
                        usedClasses.add(cls);

                        // Extract base class and variants
                        const parts = cls.split(':');
                        const baseClass = parts[parts.length - 1];

                        // Extract suffix for variable matching
                        const classParts = baseClass.split('-');
                        if (classParts.length > 1) {
                            let suffix = classParts.slice(1).join('-');

                            // Handle opacity modifiers (like /90, /50)
                            let baseSuffix = suffix;
                            if (suffix.includes('/')) {
                                const parts = suffix.split('/');
                                baseSuffix = parts[0];
                                const opacity = parts[1];

                                // Add both the base suffix and the full suffix with opacity
                                usedVariableSuffixes.add(baseSuffix);
                                usedVariableSuffixes.add(suffix); // Keep the full suffix with opacity
                            } else {
                                usedVariableSuffixes.add(suffix);
                            }

                            // For compound classes like text-content-subtle, also add the full suffix
                            // This handles cases where the variable is --color-content-subtle
                            if (classParts.length > 2) {
                                const fullSuffix = classParts.slice(1).join('-');
                                if (fullSuffix.includes('/')) {
                                    usedVariableSuffixes.add(fullSuffix.split('/')[0]);
                                } else {
                                    usedVariableSuffixes.add(fullSuffix);
                                }
                            }
                        }
                    }
                }

                return {
                    classes: Array.from(usedClasses),
                    variableSuffixes: Array.from(usedVariableSuffixes)
                };
            } catch (error) {
                console.error('Error getting used classes:', error);
                return { classes: [], variableSuffixes: [] };
            }
        }

        async fetchThemeContent() {
            const themeContents = new Set();
            const fetchPromises = [];

            // If we haven't discovered CSS files yet, do it now
            if (this.cssFiles.size === 0) {
                this.discoverCssFiles();
            }

            // Process all files concurrently
            for (const source of this.cssFiles) {
                const fetchPromise = (async () => {
                    try {
                        let content = '';

                        if (source.startsWith('inline:')) {
                            const styleId = source.replace('inline:', '');
                            const styleElement = styleId ?
                                document.getElementById(styleId) :
                                document.querySelector('style');
                            if (styleElement) {
                                content = styleElement.textContent;
                            }
                        } else {
                            // Add timestamp to prevent caching
                            const timestamp = Date.now();
                            const url = `${source}?t=${timestamp}`;

                            const response = await fetch(url, {
                                cache: 'no-store',
                                headers: {
                                    'Cache-Control': 'no-cache',
                                    'Pragma': 'no-cache'
                                }
                            });

                            if (!response.ok) {
                                console.warn('Failed to fetch stylesheet:', url);
                                return;
                            }

                            content = await response.text();
                        }

                        if (content) {
                            themeContents.add(content);
                        }
                    } catch (error) {
                        console.warn(`Error fetching CSS from ${source}:`, error);
                    }
                })();
                fetchPromises.push(fetchPromise);
            }

            // Wait for all fetches to complete
            await Promise.all(fetchPromises);

            return Array.from(themeContents).join('\n');
        }

        async processThemeContent(content) {
            try {
                const variables = this.extractThemeVariables(content);
                if (variables.size === 0) {
                    return;
                }

                // Only log and process actual changes
                let hasChanges = false;
                for (const [name, value] of variables.entries()) {
                    const currentValue = this.currentThemeVars.get(name);
                    if (currentValue !== value) {
                        hasChanges = true;
                        this.currentThemeVars.set(name, value);
                    }
                }

                if (hasChanges) {
                    // Generate utilities for these variables
                    const utilities = this.generateUtilitiesFromVars(content, this.getUsedClasses());
                    if (!utilities) {
                        return;
                    }

                    // Update styles immediately with new utilities
                    const newStyles = `@layer utilities {\n${utilities}\n}`;
                    this.updateStyles(newStyles);
                }

            } catch (error) {
                console.warn('Error processing theme content:', error);
            }
        }

        updateStyles(newStyles) {
            if (!this.styleElement) {
                console.warn('No style element found');
                return;
            }

            this.styleElement.textContent = newStyles;
        }

        extractThemeVariables(cssText) {
            const variables = new Map();

            // Extract ALL CSS custom properties from ANY declaration block
            // This regex finds --variable-name: value; patterns anywhere in the CSS
            const varRegex = /--([\w-]+):\s*([^;]+);/g;

            let varMatch;
            while ((varMatch = varRegex.exec(cssText)) !== null) {
                const name = varMatch[1];
                const value = varMatch[2].trim();
                variables.set(name, value);
            }

            return variables;
        }

        parseClassName(className) {
            // Check cache first
            if (this.classCache.has(className)) {
                return this.classCache.get(className);
            }

            const result = {
                important: className.startsWith('!'),
                variants: [],
                baseClass: className
            };

            // Remove important modifier if present
            if (result.important) {
                className = className.slice(1);
            }

            // Split by variant separator
            const parts = className.split(':');
            result.baseClass = parts.pop(); // Last part is always the base class

            // Process variants in order (left to right)
            result.variants = parts.map(variant => {
                const selector = this.variants[variant];
                if (!selector) {
                    console.warn(`Unknown variant: ${variant}`);
                    return null;
                }
                return {
                    name: variant,
                    selector: selector
                };
            }).filter(Boolean);

            // Cache the result
            this.classCache.set(className, result);
            return result;
        }

        generateUtilitiesFromVars(cssText, usedData) {
            try {
                const utilities = [];
                const variables = this.extractThemeVariables(cssText);
                const { classes: usedClasses, variableSuffixes } = usedData;

                if (variables.size === 0) {
                    return '';
                }

                // Helper to escape special characters in class names
                const escapeClassName = (className) => {
                    return className.replace(/[^a-zA-Z0-9-]/g, '\\$&');
                };

                // Helper to generate a single utility with its variants
                const generateUtility = (baseClass, css) => {
                    // Find all variants of this base class that are actually used
                    const usedVariants = usedClasses
                        .filter(cls => {
                            const parts = cls.split(':');
                            return parts[parts.length - 1] === baseClass;
                        });

                    // Generate base utility if it's used directly
                    if (usedClasses.includes(baseClass)) {
                        utilities.push(`.${escapeClassName(baseClass)} { ${css} }`);
                    }

                    // Generate each variant as a separate class
                    for (const variantClass of usedVariants) {
                        if (variantClass === baseClass) continue;

                        const parts = variantClass.split(':');
                        const variants = parts.slice(0, -1);

                        // For pseudo-classes, we need to generate a rule that matches the actual class name
                        if (variants.length === 1 && this.variants[variants[0]]?.startsWith(':')) {
                            // Generate a rule that matches the actual class name and applies the pseudo-class
                            const pseudoClass = this.variants[variants[0]];
                            const rule = `.${escapeClassName(variantClass)}${pseudoClass} { ${css} }`;
                            utilities.push(rule);
                        } else {
                            // For other variants (like dark mode, media queries)
                            let selector = `.${escapeClassName(variantClass)}`;
                            for (const variant of variants) {
                                const variantSelector = this.variants[variant];
                                if (!variantSelector) continue;

                                if (variantSelector.startsWith('@')) {
                                    // For media queries, we need to include the CSS content inside the media query block
                                    selector = `${variantSelector} { ${selector} { ${css} } }`;

                                    // Skip the final utilities.push since we already included the CSS content
                                    continue;
                                } else if (variantSelector.startsWith('.')) {
                                    selector = variantSelector.replace('&', selector);
                                }
                            }
                            const finalRule = `${selector} { ${css} }`;
                            utilities.push(finalRule);
                        }
                    }
                };

                // Generate utilities based on variable prefix
                for (const [varName, varValue] of variables.entries()) {
                    if (!varName.match(this.regexPatterns.tailwindPrefix)) {
                        continue;
                    }

                    const suffix = varName.split('-').slice(1).join('-');
                    const value = `var(--${varName})`;
                    const prefix = varName.split('-')[0] + '-';
                    const generator = this.utilityGenerators[prefix];

                    if (generator) {
                        const utilityPairs = generator(suffix, value);
                        for (const [className, css] of utilityPairs) {
                            // Check if this specific utility class is actually used (including variants)
                            const isUsed = usedClasses.some(cls => {
                                const parts = cls.split(':');
                                const baseClass = parts[parts.length - 1];
                                return baseClass === className;
                            });
                            if (isUsed) {
                                generateUtility(className, css);
                            }

                            // Check for opacity variants of this utility
                            const opacityVariants = usedClasses.filter(cls => {
                                // Check if this class has an opacity modifier and matches our base class
                                if (cls.includes('/') && cls.startsWith(className + '/')) {
                                    const opacity = cls.split('/')[1];
                                    // Validate that the opacity is a number between 0-100
                                    return !isNaN(opacity) && opacity >= 0 && opacity <= 100;
                                }
                                return false;
                            });

                            // Generate opacity utilities for each variant found
                            for (const variant of opacityVariants) {
                                const opacity = variant.split('/')[1];
                                const opacityValue = `color-mix(in oklch, ${value} ${opacity}%, transparent)`;
                                const opacityCss = css.replace(value, opacityValue);
                                generateUtility(variant, opacityCss);
                            }
                        }
                    }
                }

                return utilities.join('\n');
            } catch (error) {
                console.error('Error generating utilities:', error);
                return '';
            }
        }

        async compile() {
            try {
                // Prevent too frequent compilations
                const now = Date.now();
                if (now - this.lastCompileTime < this.minCompileInterval) {
                    return;
                }
                this.lastCompileTime = now;

                if (this.isCompiling) {
                    return;
                }
                this.isCompiling = true;

                // Get used classes first
                const usedData = this.getUsedClasses();

                // If no classes found, wait a bit and try again
                if (usedData.classes.length === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    this.isCompiling = false;
                    return this.compile();
                }

                // Start fetching theme content
                const themeCss = await this.fetchThemeContent();
                if (!themeCss) return;

                // Process theme content and generate utilities in one pass
                const variables = this.extractThemeVariables(themeCss);
                if (variables.size === 0) return;

                // Update variables and check for changes
                let hasChanges = false;
                for (const [name, value] of variables.entries()) {
                    const currentValue = this.currentThemeVars.get(name);
                    if (currentValue !== value) {
                        hasChanges = true;
                        this.currentThemeVars.set(name, value);
                    }
                }

                // Always generate utilities when variables change or when we have new classes
                if (hasChanges || usedData.classes.length > 0) {
                    const utilities = this.generateUtilitiesFromVars(themeCss, usedData);
                    if (!utilities) return;

                    const finalCss = `@layer utilities {\n${utilities}\n}`;
                    this.styleElement.textContent = finalCss;

                    // Cache the result
                    const themeHash = this.generateThemeHash(themeCss);
                    const cacheKey = `${themeHash}:${usedData.classes.sort().join(',')}`;
                    this.cache.set(cacheKey, {
                        css: finalCss,
                        timestamp: Date.now(),
                        themeHash: themeHash
                    });
                    this.savePersistentCache();
                    this.cleanupCache();
                }

            } catch (error) {
                console.error('Error compiling Tailwind CSS:', error);
            } finally {
                this.isCompiling = false;
            }
        }
    }

    // Initialize immediately without waiting for DOMContentLoaded
    const compiler = new TailwindCompiler();

    // Also handle DOMContentLoaded for any elements that might be added later
    document.addEventListener('DOMContentLoaded', () => {
        if (!compiler.isCompiling) {
            compiler.compile();
        }
    });

    var temp_plugin = {};

    var hasRequiredTemp_plugin;

    function requireTemp_plugin () {
    	if (hasRequiredTemp_plugin) return temp_plugin;
    	hasRequiredTemp_plugin = 1;
    	/*! Indux Markdown 1.0.0 - MIT License */
    	const marked = self.marked;

    	// Configure marked to preserve full language strings
    	marked.use({
    	    renderer: {
    	        code(token) {
    	            const lang = token.lang || '';
    	            const text = token.text || '';
    	            const escaped = token.escaped || false;
    	            
    	            // Store the full language string in a data attribute
    	            const dataLang = lang ? ` data-language="${lang}"` : '';
    	            const className = lang ? ` class="language-${lang.split(' ')[0]}"` : '';
    	            
    	            const code = escaped ? text : text.replace(/[&<>"']/g, (match) => {
    	                const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    	                return escapeMap[match];
    	            });
    	            
    	            return `<pre${dataLang}><code${className}>${code}</code></pre>\n`;
    	        }
    	    }
    	});

    	// Check if the code plugin is available
    	function isCodePluginAvailable() {
    	    return typeof window.XCodeElement !== 'undefined' || 
    	           document.querySelector('script[src*="indux.code.js"]') !== null;
    	}

    	// Convert markdown code blocks to x-code elements
    	function convertCodeBlocks(element) {
    	    if (!isCodePluginAvailable()) {
    	        return; // Code plugin not available, use default rendering
    	    }

    	    const codeBlocks = element.querySelectorAll('pre code');

    	    
    	    // Define valid languages array
    	    const validLanguages = ['javascript', 'js', 'typescript', 'ts', 'html', 'css', 'python', 'py', 'java', 'c', 'cpp', 'csharp', 'cs', 'php', 'ruby', 'rb', 'go', 'rust', 'rs', 'swift', 'kotlin', 'kt', 'scala', 'sql', 'json', 'yaml', 'yml', 'xml', 'markdown', 'md', 'bash', 'sh', 'powershell', 'ps', 'dockerfile', 'docker', 'nginx', 'apache', 'git', 'diff', 'text', 'plaintext'];
    	    
    	    // Define callout types that should be converted to aside elements
    	    const calloutTypes = ['frame', 'note', 'warning', 'info', 'tip', 'success', 'error', 'negative'];
    	    
    	    codeBlocks.forEach((codeBlock, index) => {
    	        const pre = codeBlock.parentElement;
    	        let language = codeBlock.className?.replace('language-', '') || '';
    	        const code = codeBlock.textContent;
    	        
    	        // Check if this is a callout block (starts with a callout type)
    	        const languageParts = language.split(/\s+/);
    	        const firstPart = languageParts[0]?.toLowerCase();
    	        
    	        if (calloutTypes.includes(firstPart)) {
    	            // This is a callout block - convert to aside element
    	            const calloutType = firstPart;
    	            
    	            // Create aside element
    	            const aside = document.createElement('aside');
    	            aside.className = calloutType;
    	            
    	            // Set the content as HTML to render actual elements
    	            aside.innerHTML = code;
    	            
    	            // Replace the pre element with aside
    	            pre.parentNode.replaceChild(aside, pre);
    	            return; // Skip the rest of the processing
    	        }
    	        
    	        // Parse Mintlify-style meta options from language
    	        let title = '';
    	        let lineNumbers = false;
    	        
    	        if (language) {
    	            // Split by spaces to handle multiple options
    	            const parts = language.split(/\s+/);
    	            const parsedLanguage = parts[0];
    	            
    	            // Check if first part is a valid language
    	            if (validLanguages.includes(parsedLanguage.toLowerCase())) {
    	                language = parsedLanguage;
    	                
    	                // Parse remaining parts for options
    	                for (let i = 1; i < parts.length; i++) {
    	                    const part = parts[i].toLowerCase();
    	                    
    	                    // Check for line numbers
    	                    if (part === 'numbers' || part === 'lines') {
    	                        lineNumbers = true;
    	                    }
    	                    // Check for title (anything that's not a known option)
    	                    else if (!['numbers', 'lines', 'expandable', 'wrap', 'focus', 'highlight'].includes(part)) {
    	                        title = parts[i]; // Use original case for title
    	                    }
    	                }
    	            } else {
    	                // If first part isn't a language, treat it as a title
    	                title = parts[0];
    	                language = 'text'; // Default to text
    	                
    	                // Check remaining parts for options
    	                for (let i = 1; i < parts.length; i++) {
    	                    const part = parts[i].toLowerCase();
    	                    if (part === 'numbers' || part === 'lines') {
    	                        lineNumbers = true;
    	                    }
    	                }
    	            }
    	        }
    	        
    	        // Also check if the pre element has any data attributes that might contain the original language
    	        const preLanguage = pre.getAttribute('data-language') || pre.getAttribute('lang');
    	        if (preLanguage && preLanguage !== language) {
    	            // Parse the pre language as well
    	            const preParts = preLanguage.split(/\s+/);
    	            if (preParts.length > 1) {
    	                // Use the pre language if it has more parts
    	                const preParsedLanguage = preParts[0];
    	                if (validLanguages.includes(preParsedLanguage.toLowerCase())) {
    	                    language = preParsedLanguage;
    	                    
    	                    // Parse remaining parts for options
    	                    for (let i = 1; i < preParts.length; i++) {
    	                        const part = preParts[i].toLowerCase();
    	                        
    	                        // Check for line numbers
    	                        if (part === 'numbers' || part === 'lines') {
    	                            lineNumbers = true;
    	                        }
    	                        // Check for title (anything that's not a known option)
    	                        else if (!['numbers', 'lines', 'expandable', 'wrap', 'focus', 'highlight'].includes(part)) {
    	                            title = preParts[i]; // Use original case for title
    	                        }
    	                    }
    	                }
    	            }
    	        }
    	        
    	        // Create x-code element
    	        const xCode = document.createElement('x-code');
    	        if (language && language !== 'text') {
    	            xCode.setAttribute('language', language);
    	        }
    	        
    	        // Add title if present
    	        if (title) {
    	            xCode.setAttribute('name', title);
    	        }
    	        
    	        // Add line numbers if specified
    	        if (lineNumbers) {
    	            xCode.setAttribute('numbers', '');
    	        }
    	        
    	        // Set the code content
    	        let cleanCode = code;
    	        if (title) {
    	            // Remove the title from the beginning of the code if it appears there
    	            const titlePattern = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n?`, 'i');
    	            cleanCode = code.replace(titlePattern, '').trim();
    	        }
    	        xCode.textContent = cleanCode;
    	        
    	        // Replace the pre element with x-code
    	        pre.parentNode.replaceChild(xCode, pre);
    	    });
    	}

    	// Initialize plugin when either DOM is ready or Alpine is ready
    	function initializeMarkdownPlugin() {
    	    // Configure marked to generate heading IDs
    	    marked.use({
    	        renderer: {
    	            heading(token) {
    	                // Extract text and level from the token
    	                const text = token.text || '';
    	                const level = token.depth || 1;
    	                const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    	                return `<h${level} id="${escapedText}">${text}</h${level}>`;
    	            }
    	        }
    	    });

    	    // Register markdown directive
    	    Alpine.directive('markdown', (el, { expression, modifiers }, { effect, evaluateLater }) => {
    	        // Store original markdown content
    	        let markdownSource = '';
    	        let isUpdating = false;

    	        const normalizeContent = (content) => {
    	            const lines = content.split('\n');
    	            const commonIndent = lines
    	                .filter(line => line.trim())
    	                .reduce((min, line) => {
    	                    const indent = line.match(/^\s*/)[0].length;
    	                    return Math.min(min, indent);
    	                }, Infinity);

    	            return lines
    	                .map(line => line.slice(commonIndent))
    	                .join('\n')
    	                .trim();
    	        };

    	        const updateContent = async (element, newContent = null) => {
    	            if (isUpdating) return;
    	            isUpdating = true;

    	            try {
    	                // Update source if new content provided
    	                if (newContent !== null && newContent.trim() !== '') {
    	                    markdownSource = normalizeContent(newContent);
    	                }

    	                const html = marked.parse(markdownSource);

    	                // Only update if content has changed and isn't empty
    	                if (element.innerHTML !== html && html.trim() !== '') {
    	                    // Create a temporary container to hold the HTML
    	                    const temp = document.createElement('div');
    	                    temp.innerHTML = html;

    	                    // Convert code blocks to x-code if plugin is available
    	                    convertCodeBlocks(temp);

    	                    // Replace the content
    	                    element.innerHTML = '';
    	                    while (temp.firstChild) {
    	                        element.appendChild(temp.firstChild);
    	                    }
    	                }
    	            } finally {
    	                isUpdating = false;
    	            }
    	        };

    	        // Handle inline markdown content (no expression or 'inline')
    	        if (!expression || expression === 'inline') {
    	            // Initial parse
    	            markdownSource = normalizeContent(el.textContent);
    	            updateContent(el);

    	            // Set up mutation observer for streaming content
    	            const observer = new MutationObserver((mutations) => {
    	                let newContent = null;

    	                for (const mutation of mutations) {
    	                    if (mutation.type === 'childList') {
    	                        const textNodes = Array.from(el.childNodes)
    	                            .filter(node => node.nodeType === Node.TEXT_NODE);
    	                        if (textNodes.length > 0) {
    	                            newContent = textNodes.map(node => node.textContent).join('');
    	                            break;
    	                        }
    	                    } else if (mutation.type === 'characterData') {
    	                        newContent = mutation.target.textContent;
    	                        break;
    	                    }
    	                }

    	                if (newContent && newContent.trim() !== '') {
    	                    updateContent(el, newContent);
    	                }
    	            });

    	            observer.observe(el, {
    	                characterData: true,
    	                childList: true,
    	                subtree: true,
    	                characterDataOldValue: true
    	            });

    	            return;
    	        }

    	        // Handle expressions (file paths, inline strings, content references)
    	        const getMarkdownContent = evaluateLater(expression);

    	        effect(() => {
    	            getMarkdownContent(async (pathOrContent) => {
    	                if (pathOrContent === undefined) {
    	                    pathOrContent = expression;
    	                }

    	                // Check if this looks like a file path (contains .md, .markdown, or starts with /)
    	                const isFilePath = typeof pathOrContent === 'string' &&
    	                    (pathOrContent.includes('.md') ||
    	                        pathOrContent.includes('.markdown') ||
    	                        pathOrContent.startsWith('/') ||
    	                        pathOrContent.includes('/'));

    	                let markdownContent = pathOrContent;

    	                // If it's a file path, fetch the content
    	                if (isFilePath) {
    	                    try {
    	                        const response = await fetch(pathOrContent);
    	                        if (response.ok) {
    	                            markdownContent = await response.text();
    	                        } else {
    	                            console.warn(`[Indux] Failed to fetch markdown file: ${pathOrContent}`);
    	                            markdownContent = `# Error Loading Content\n\nCould not load: ${pathOrContent}`;
    	                        }
    	                    } catch (error) {
    	                        console.error(`[Indux] Error fetching markdown file: ${pathOrContent}`, error);
    	                        markdownContent = `# Error Loading Content\n\nCould not load: ${pathOrContent}\n\nError: ${error.message}`;
    	                    }
    	                }

    	                const html = marked.parse(markdownContent);
    	                
    	                // Create temporary container and convert code blocks
    	                const temp = document.createElement('div');
    	                temp.innerHTML = html;
    	                convertCodeBlocks(temp);
    	                
    	                el.innerHTML = '';
    	                while (temp.firstChild) {
    	                    el.appendChild(temp.firstChild);
    	                }

    	                // Extract headings for anchor links
    	                const headings = [];
    	                const headingElements = el.querySelectorAll('h1, h2, h3');
    	                headingElements.forEach(heading => {
    	                    headings.push({
    	                        id: heading.id,
    	                        text: heading.textContent,
    	                        level: parseInt(heading.tagName.charAt(1))
    	                    });
    	                });

    	                // Store headings in Alpine data if 'headings' modifier is used
    	                if (modifiers.includes('headings')) {
    	                    // Generate a unique ID for this markdown section
    	                    const sectionId = 'markdown-' + Math.random().toString(36).substr(2, 9);
    	                    el.setAttribute('data-headings-section', sectionId);

    	                    // Store headings in a global registry
    	                    if (!window._induxHeadings) {
    	                        window._induxHeadings = {};
    	                    }
    	                    window._induxHeadings[sectionId] = headings;
    	                }
    	            });
    	        });
    	    });
    	}

    	// Handle both DOMContentLoaded and alpine:init
    	if (document.readyState === 'loading') {
    	    document.addEventListener('DOMContentLoaded', () => {
    	        if (window.Alpine) initializeMarkdownPlugin();
    	    });
    	}

    	document.addEventListener('alpine:init', initializeMarkdownPlugin);
    	return temp_plugin;
    }

    requireTemp_plugin();

    // Additional dependencies for Alpine+Tailwind build
    // Update these filenames as needed when versions change
    const TAILWIND_V4_FILE = 'tailwind.v4.1.js';
    const ALPINE_FILE = 'alpine.v3.14.9.js';

    exports.ALPINE_FILE = ALPINE_FILE;
    exports.TAILWIND_V4_FILE = TAILWIND_V4_FILE;

    return exports;

})({});
