(function () {
    'use strict';

    /**
     * Marked.js
     * 
     * By Christopher Jeffrey
     * Provided under MIT License
     * https://github.com/markedjs/marked
     * 
     */
    !function (e, t) { "object" == typeof exports && "undefined" != typeof module ? t(exports) : "function" == typeof define && define.amd ? define(["exports"], t) : t((e = "undefined" != typeof globalThis ? globalThis : e || self).marked = {}) }(this, (function (e) { "use strict"; function t() { return { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null } } function n(t) { e.defaults = t } e.defaults = { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null }; const s = /[&<>"']/, r = new RegExp(s.source, "g"), i = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, l = new RegExp(i.source, "g"), o = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }, a = e => o[e]; function c(e, t) { if (t) { if (s.test(e)) return e.replace(r, a) } else if (i.test(e)) return e.replace(l, a); return e } const h = /(^|[^\[])\^/g; function p(e, t) { let n = "string" == typeof e ? e : e.source; t = t || ""; const s = { replace: (e, t) => { let r = "string" == typeof t ? t : t.source; return r = r.replace(h, "$1"), n = n.replace(e, r), s }, getRegex: () => new RegExp(n, t) }; return s } function u(e) { try { e = encodeURI(e).replace(/%25/g, "%") } catch { return null } return e } const k = { exec: () => null }; function g(e, t) { const n = e.replace(/\|/g, ((e, t, n) => { let s = !1, r = t; for (; --r >= 0 && "\\" === n[r];)s = !s; return s ? "|" : " |" })).split(/ \|/); let s = 0; if (n[0].trim() || n.shift(), n.length > 0 && !n[n.length - 1].trim() && n.pop(), t) if (n.length > t) n.splice(t); else for (; n.length < t;)n.push(""); for (; s < n.length; s++)n[s] = n[s].trim().replace(/\\\|/g, "|"); return n } function f(e, t, n) { const s = e.length; if (0 === s) return ""; let r = 0; for (; r < s;) { const i = e.charAt(s - r - 1); if (i !== t || n) { if (i === t || !n) break; r++ } else r++ } return e.slice(0, s - r) } function d(e, t, n, s) { const r = t.href, i = t.title ? c(t.title) : null, l = e[1].replace(/\\([\[\]])/g, "$1"); if ("!" !== e[0].charAt(0)) { s.state.inLink = !0; const e = { type: "link", raw: n, href: r, title: i, text: l, tokens: s.inlineTokens(l) }; return s.state.inLink = !1, e } return { type: "image", raw: n, href: r, title: i, text: c(l) } } class x { options; rules; lexer; constructor(t) { this.options = t || e.defaults } space(e) { const t = this.rules.block.newline.exec(e); if (t && t[0].length > 0) return { type: "space", raw: t[0] } } code(e) { const t = this.rules.block.code.exec(e); if (t) { const e = t[0].replace(/^(?: {1,4}| {0,3}\t)/gm, ""); return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? e : f(e, "\n") } } } fences(e) { const t = this.rules.block.fences.exec(e); if (t) { const e = t[0], n = function (e, t) { const n = e.match(/^(\s+)(?:```)/); if (null === n) return t; const s = n[1]; return t.split("\n").map((e => { const t = e.match(/^\s+/); if (null === t) return e; const [n] = t; return n.length >= s.length ? e.slice(s.length) : e })).join("\n") }(e, t[3] || ""); return { type: "code", raw: e, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: n } } } heading(e) { const t = this.rules.block.heading.exec(e); if (t) { let e = t[2].trim(); if (/#$/.test(e)) { const t = f(e, "#"); this.options.pedantic ? e = t.trim() : t && !/ $/.test(t) || (e = t.trim()) } return { type: "heading", raw: t[0], depth: t[1].length, text: e, tokens: this.lexer.inline(e) } } } hr(e) { const t = this.rules.block.hr.exec(e); if (t) return { type: "hr", raw: f(t[0], "\n") } } blockquote(e) { const t = this.rules.block.blockquote.exec(e); if (t) { let e = f(t[0], "\n").split("\n"), n = "", s = ""; const r = []; for (; e.length > 0;) { let t = !1; const i = []; let l; for (l = 0; l < e.length; l++)if (/^ {0,3}>/.test(e[l])) i.push(e[l]), t = !0; else { if (t) break; i.push(e[l]) } e = e.slice(l); const o = i.join("\n"), a = o.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, "\n    $1").replace(/^ {0,3}>[ \t]?/gm, ""); n = n ? `${n}\n${o}` : o, s = s ? `${s}\n${a}` : a; const c = this.lexer.state.top; if (this.lexer.state.top = !0, this.lexer.blockTokens(a, r, !0), this.lexer.state.top = c, 0 === e.length) break; const h = r[r.length - 1]; if ("code" === h?.type) break; if ("blockquote" === h?.type) { const t = h, i = t.raw + "\n" + e.join("\n"), l = this.blockquote(i); r[r.length - 1] = l, n = n.substring(0, n.length - t.raw.length) + l.raw, s = s.substring(0, s.length - t.text.length) + l.text; break } if ("list" !== h?.type); else { const t = h, i = t.raw + "\n" + e.join("\n"), l = this.list(i); r[r.length - 1] = l, n = n.substring(0, n.length - h.raw.length) + l.raw, s = s.substring(0, s.length - t.raw.length) + l.raw, e = i.substring(r[r.length - 1].raw.length).split("\n") } } return { type: "blockquote", raw: n, tokens: r, text: s } } } list(e) { let t = this.rules.block.list.exec(e); if (t) { let n = t[1].trim(); const s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: !1, items: [] }; n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]"); const i = new RegExp(`^( {0,3}${n})((?:[\t ][^\\n]*)?(?:\\n|$))`); let l = !1; for (; e;) { let n = !1, s = "", o = ""; if (!(t = i.exec(e))) break; if (this.rules.block.hr.test(e)) break; s = t[0], e = e.substring(s.length); let a = t[2].split("\n", 1)[0].replace(/^\t+/, (e => " ".repeat(3 * e.length))), c = e.split("\n", 1)[0], h = !a.trim(), p = 0; if (this.options.pedantic ? (p = 2, o = a.trimStart()) : h ? p = t[1].length + 1 : (p = t[2].search(/[^ ]/), p = p > 4 ? 1 : p, o = a.slice(p), p += t[1].length), h && /^[ \t]*$/.test(c) && (s += c + "\n", e = e.substring(c.length + 1), n = !0), !n) { const t = new RegExp(`^ {0,${Math.min(3, p - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`), n = new RegExp(`^ {0,${Math.min(3, p - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), r = new RegExp(`^ {0,${Math.min(3, p - 1)}}(?:\`\`\`|~~~)`), i = new RegExp(`^ {0,${Math.min(3, p - 1)}}#`), l = new RegExp(`^ {0,${Math.min(3, p - 1)}}<[a-z].*>`, "i"); for (; e;) { const u = e.split("\n", 1)[0]; let k; if (c = u, this.options.pedantic ? (c = c.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), k = c) : k = c.replace(/\t/g, "    "), r.test(c)) break; if (i.test(c)) break; if (l.test(c)) break; if (t.test(c)) break; if (n.test(c)) break; if (k.search(/[^ ]/) >= p || !c.trim()) o += "\n" + k.slice(p); else { if (h) break; if (a.replace(/\t/g, "    ").search(/[^ ]/) >= 4) break; if (r.test(a)) break; if (i.test(a)) break; if (n.test(a)) break; o += "\n" + c } h || c.trim() || (h = !0), s += u + "\n", e = e.substring(u.length + 1), a = k.slice(p) } } r.loose || (l ? r.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(s) && (l = !0)); let u, k = null; this.options.gfm && (k = /^\[[ xX]\] /.exec(o), k && (u = "[ ] " !== k[0], o = o.replace(/^\[[ xX]\] +/, ""))), r.items.push({ type: "list_item", raw: s, task: !!k, checked: u, loose: !1, text: o, tokens: [] }), r.raw += s } r.items[r.items.length - 1].raw = r.items[r.items.length - 1].raw.trimEnd(), r.items[r.items.length - 1].text = r.items[r.items.length - 1].text.trimEnd(), r.raw = r.raw.trimEnd(); for (let e = 0; e < r.items.length; e++)if (this.lexer.state.top = !1, r.items[e].tokens = this.lexer.blockTokens(r.items[e].text, []), !r.loose) { const t = r.items[e].tokens.filter((e => "space" === e.type)), n = t.length > 0 && t.some((e => /\n.*\n/.test(e.raw))); r.loose = n } if (r.loose) for (let e = 0; e < r.items.length; e++)r.items[e].loose = !0; return r } } html(e) { const t = this.rules.block.html.exec(e); if (t) { return { type: "html", block: !0, raw: t[0], pre: "pre" === t[1] || "script" === t[1] || "style" === t[1], text: t[0] } } } def(e) { const t = this.rules.block.def.exec(e); if (t) { const e = t[1].toLowerCase().replace(/\s+/g, " "), n = t[2] ? t[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3]; return { type: "def", tag: e, raw: t[0], href: n, title: s } } } table(e) { const t = this.rules.block.table.exec(e); if (!t) return; if (!/[:|]/.test(t[2])) return; const n = g(t[1]), s = t[2].replace(/^\||\| *$/g, "").split("|"), r = t[3] && t[3].trim() ? t[3].replace(/\n[ \t]*$/, "").split("\n") : [], i = { type: "table", raw: t[0], header: [], align: [], rows: [] }; if (n.length === s.length) { for (const e of s) /^ *-+: *$/.test(e) ? i.align.push("right") : /^ *:-+: *$/.test(e) ? i.align.push("center") : /^ *:-+ *$/.test(e) ? i.align.push("left") : i.align.push(null); for (let e = 0; e < n.length; e++)i.header.push({ text: n[e], tokens: this.lexer.inline(n[e]), header: !0, align: i.align[e] }); for (const e of r) i.rows.push(g(e, i.header.length).map(((e, t) => ({ text: e, tokens: this.lexer.inline(e), header: !1, align: i.align[t] })))); return i } } lheading(e) { const t = this.rules.block.lheading.exec(e); if (t) return { type: "heading", raw: t[0], depth: "=" === t[2].charAt(0) ? 1 : 2, text: t[1], tokens: this.lexer.inline(t[1]) } } paragraph(e) { const t = this.rules.block.paragraph.exec(e); if (t) { const e = "\n" === t[1].charAt(t[1].length - 1) ? t[1].slice(0, -1) : t[1]; return { type: "paragraph", raw: t[0], text: e, tokens: this.lexer.inline(e) } } } text(e) { const t = this.rules.block.text.exec(e); if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) } } escape(e) { const t = this.rules.inline.escape.exec(e); if (t) return { type: "escape", raw: t[0], text: c(t[1]) } } tag(e) { const t = this.rules.inline.tag.exec(e); if (t) return !this.lexer.state.inLink && /^<a /i.test(t[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(t[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(t[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(t[0]) && (this.lexer.state.inRawBlock = !1), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: !1, text: t[0] } } link(e) { const t = this.rules.inline.link.exec(e); if (t) { const e = t[2].trim(); if (!this.options.pedantic && /^</.test(e)) { if (!/>$/.test(e)) return; const t = f(e.slice(0, -1), "\\"); if ((e.length - t.length) % 2 == 0) return } else { const e = function (e, t) { if (-1 === e.indexOf(t[1])) return -1; let n = 0; for (let s = 0; s < e.length; s++)if ("\\" === e[s]) s++; else if (e[s] === t[0]) n++; else if (e[s] === t[1] && (n--, n < 0)) return s; return -1 }(t[2], "()"); if (e > -1) { const n = (0 === t[0].indexOf("!") ? 5 : 4) + t[1].length + e; t[2] = t[2].substring(0, e), t[0] = t[0].substring(0, n).trim(), t[3] = "" } } let n = t[2], s = ""; if (this.options.pedantic) { const e = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(n); e && (n = e[1], s = e[3]) } else s = t[3] ? t[3].slice(1, -1) : ""; return n = n.trim(), /^</.test(n) && (n = this.options.pedantic && !/>$/.test(e) ? n.slice(1) : n.slice(1, -1)), d(t, { href: n ? n.replace(this.rules.inline.anyPunctuation, "$1") : n, title: s ? s.replace(this.rules.inline.anyPunctuation, "$1") : s }, t[0], this.lexer) } } reflink(e, t) { let n; if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) { const e = t[(n[2] || n[1]).replace(/\s+/g, " ").toLowerCase()]; if (!e) { const e = n[0].charAt(0); return { type: "text", raw: e, text: e } } return d(n, e, n[0], this.lexer) } } emStrong(e, t, n = "") { let s = this.rules.inline.emStrongLDelim.exec(e); if (!s) return; if (s[3] && n.match(/[\p{L}\p{N}]/u)) return; if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) { const n = [...s[0]].length - 1; let r, i, l = n, o = 0; const a = "*" === s[0][0] ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd; for (a.lastIndex = 0, t = t.slice(-1 * e.length + n); null != (s = a.exec(t));) { if (r = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !r) continue; if (i = [...r].length, s[3] || s[4]) { l += i; continue } if ((s[5] || s[6]) && n % 3 && !((n + i) % 3)) { o += i; continue } if (l -= i, l > 0) continue; i = Math.min(i, i + l + o); const t = [...s[0]][0].length, a = e.slice(0, n + s.index + t + i); if (Math.min(n, i) % 2) { const e = a.slice(1, -1); return { type: "em", raw: a, text: e, tokens: this.lexer.inlineTokens(e) } } const c = a.slice(2, -2); return { type: "strong", raw: a, text: c, tokens: this.lexer.inlineTokens(c) } } } } codespan(e) { const t = this.rules.inline.code.exec(e); if (t) { let e = t[2].replace(/\n/g, " "); const n = /[^ ]/.test(e), s = /^ /.test(e) && / $/.test(e); return n && s && (e = e.substring(1, e.length - 1)), e = c(e, !0), { type: "codespan", raw: t[0], text: e } } } br(e) { const t = this.rules.inline.br.exec(e); if (t) return { type: "br", raw: t[0] } } del(e) { const t = this.rules.inline.del.exec(e); if (t) return { type: "del", raw: t[0], text: t[2], tokens: this.lexer.inlineTokens(t[2]) } } autolink(e) { const t = this.rules.inline.autolink.exec(e); if (t) { let e, n; return "@" === t[2] ? (e = c(t[1]), n = "mailto:" + e) : (e = c(t[1]), n = e), { type: "link", raw: t[0], text: e, href: n, tokens: [{ type: "text", raw: e, text: e }] } } } url(e) { let t; if (t = this.rules.inline.url.exec(e)) { let e, n; if ("@" === t[2]) e = c(t[0]), n = "mailto:" + e; else { let s; do { s = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "" } while (s !== t[0]); e = c(t[0]), n = "www." === t[1] ? "http://" + t[0] : t[0] } return { type: "link", raw: t[0], text: e, href: n, tokens: [{ type: "text", raw: e, text: e }] } } } inlineText(e) { const t = this.rules.inline.text.exec(e); if (t) { let e; return e = this.lexer.state.inRawBlock ? t[0] : c(t[0]), { type: "text", raw: t[0], text: e } } } } const b = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, w = /(?:[*+-]|\d{1,9}[.)])/, m = p(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, w).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), y = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, $ = /(?!\s*\])(?:\\.|[^\[\]\\])+/, z = p(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", $).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), T = p(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, w).getRegex(), R = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", _ = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, A = p("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i").replace("comment", _).replace("tag", R).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), S = p(y).replace("hr", b).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", R).getRegex(), I = { blockquote: p(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", S).getRegex(), code: /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, def: z, fences: /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, heading: /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, hr: b, html: A, lheading: m, list: T, newline: /^(?:[ \t]*(?:\n|$))+/, paragraph: S, table: k, text: /^[^\n]+/ }, E = p("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", b).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}\t)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", R).getRegex(), q = { ...I, table: E, paragraph: p(y).replace("hr", b).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", E).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", R).getRegex() }, Z = { ...I, html: p("^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:\"[^\"]*\"|'[^']*'|\\s[^'\"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))").replace("comment", _).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: k, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: p(y).replace("hr", b).replace("heading", " *#{1,6} *[^\n]").replace("lheading", m).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() }, P = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, L = /^( {2,}|\\)\n(?!\s*$)/, v = "\\p{P}\\p{S}", Q = p(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, v).getRegex(), B = p(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, v).getRegex(), M = p("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, v).getRegex(), O = p("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, v).getRegex(), j = p(/\\([punct])/, "gu").replace(/punct/g, v).getRegex(), D = p(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), C = p(_).replace("(?:--\x3e|$)", "--\x3e").getRegex(), H = p("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", C).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), U = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, X = p(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", U).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), F = p(/^!?\[(label)\]\[(ref)\]/).replace("label", U).replace("ref", $).getRegex(), N = p(/^!?\[(ref)\](?:\[\])?/).replace("ref", $).getRegex(), G = { _backpedal: k, anyPunctuation: j, autolink: D, blockSkip: /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, br: L, code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, del: k, emStrongLDelim: B, emStrongRDelimAst: M, emStrongRDelimUnd: O, escape: P, link: X, nolink: N, punctuation: Q, reflink: F, reflinkSearch: p("reflink|nolink(?!\\()", "g").replace("reflink", F).replace("nolink", N).getRegex(), tag: H, text: /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, url: k }, J = { ...G, link: p(/^!?\[(label)\]\((.*?)\)/).replace("label", U).getRegex(), reflink: p(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", U).getRegex() }, K = { ...G, escape: p(P).replace("])", "~|])").getRegex(), url: p(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])([\s\S]*?[^\s~])\1(?=[^~]|$)/, text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/ }, V = { ...K, br: p(L).replace("{2,}", "*").getRegex(), text: p(K.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() }, W = { normal: I, gfm: q, pedantic: Z }, Y = { normal: G, gfm: K, breaks: V, pedantic: J }; class ee { tokens; options; state; tokenizer; inlineQueue; constructor(t) { this.tokens = [], this.tokens.links = Object.create(null), this.options = t || e.defaults, this.options.tokenizer = this.options.tokenizer || new x, this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: !1, inRawBlock: !1, top: !0 }; const n = { block: W.normal, inline: Y.normal }; this.options.pedantic ? (n.block = W.pedantic, n.inline = Y.pedantic) : this.options.gfm && (n.block = W.gfm, this.options.breaks ? n.inline = Y.breaks : n.inline = Y.gfm), this.tokenizer.rules = n } static get rules() { return { block: W, inline: Y } } static lex(e, t) { return new ee(t).lex(e) } static lexInline(e, t) { return new ee(t).inlineTokens(e) } lex(e) { e = e.replace(/\r\n|\r/g, "\n"), this.blockTokens(e, this.tokens); for (let e = 0; e < this.inlineQueue.length; e++) { const t = this.inlineQueue[e]; this.inlineTokens(t.src, t.tokens) } return this.inlineQueue = [], this.tokens } blockTokens(e, t = [], n = !1) { let s, r, i; for (this.options.pedantic && (e = e.replace(/\t/g, "    ").replace(/^ +$/gm, "")); e;)if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((n => !!(s = n.call({ lexer: this }, e, t)) && (e = e.substring(s.raw.length), t.push(s), !0))))) if (s = this.tokenizer.space(e)) e = e.substring(s.raw.length), 1 === s.raw.length && t.length > 0 ? t[t.length - 1].raw += "\n" : t.push(s); else if (s = this.tokenizer.code(e)) e = e.substring(s.raw.length), r = t[t.length - 1], !r || "paragraph" !== r.type && "text" !== r.type ? t.push(s) : (r.raw += "\n" + s.raw, r.text += "\n" + s.text, this.inlineQueue[this.inlineQueue.length - 1].src = r.text); else if (s = this.tokenizer.fences(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.heading(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.hr(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.blockquote(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.list(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.html(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.def(e)) e = e.substring(s.raw.length), r = t[t.length - 1], !r || "paragraph" !== r.type && "text" !== r.type ? this.tokens.links[s.tag] || (this.tokens.links[s.tag] = { href: s.href, title: s.title }) : (r.raw += "\n" + s.raw, r.text += "\n" + s.raw, this.inlineQueue[this.inlineQueue.length - 1].src = r.text); else if (s = this.tokenizer.table(e)) e = e.substring(s.raw.length), t.push(s); else if (s = this.tokenizer.lheading(e)) e = e.substring(s.raw.length), t.push(s); else { if (i = e, this.options.extensions && this.options.extensions.startBlock) { let t = 1 / 0; const n = e.slice(1); let s; this.options.extensions.startBlock.forEach((e => { s = e.call({ lexer: this }, n), "number" == typeof s && s >= 0 && (t = Math.min(t, s)) })), t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1)) } if (this.state.top && (s = this.tokenizer.paragraph(i))) r = t[t.length - 1], n && "paragraph" === r?.type ? (r.raw += "\n" + s.raw, r.text += "\n" + s.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : t.push(s), n = i.length !== e.length, e = e.substring(s.raw.length); else if (s = this.tokenizer.text(e)) e = e.substring(s.raw.length), r = t[t.length - 1], r && "text" === r.type ? (r.raw += "\n" + s.raw, r.text += "\n" + s.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = r.text) : t.push(s); else if (e) { const t = "Infinite loop on byte: " + e.charCodeAt(0); if (this.options.silent) { console.error(t); break } throw new Error(t) } } return this.state.top = !0, t } inline(e, t = []) { return this.inlineQueue.push({ src: e, tokens: t }), t } inlineTokens(e, t = []) { let n, s, r, i, l, o, a = e; if (this.tokens.links) { const e = Object.keys(this.tokens.links); if (e.length > 0) for (; null != (i = this.tokenizer.rules.inline.reflinkSearch.exec(a));)e.includes(i[0].slice(i[0].lastIndexOf("[") + 1, -1)) && (a = a.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex)) } for (; null != (i = this.tokenizer.rules.inline.blockSkip.exec(a));)a = a.slice(0, i.index) + "[" + "a".repeat(i[0].length - 2) + "]" + a.slice(this.tokenizer.rules.inline.blockSkip.lastIndex); for (; null != (i = this.tokenizer.rules.inline.anyPunctuation.exec(a));)a = a.slice(0, i.index) + "++" + a.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex); for (; e;)if (l || (o = ""), l = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((s => !!(n = s.call({ lexer: this }, e, t)) && (e = e.substring(n.raw.length), t.push(n), !0))))) if (n = this.tokenizer.escape(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.tag(e)) e = e.substring(n.raw.length), s = t[t.length - 1], s && "text" === n.type && "text" === s.type ? (s.raw += n.raw, s.text += n.text) : t.push(n); else if (n = this.tokenizer.link(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.reflink(e, this.tokens.links)) e = e.substring(n.raw.length), s = t[t.length - 1], s && "text" === n.type && "text" === s.type ? (s.raw += n.raw, s.text += n.text) : t.push(n); else if (n = this.tokenizer.emStrong(e, a, o)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.codespan(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.br(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.del(e)) e = e.substring(n.raw.length), t.push(n); else if (n = this.tokenizer.autolink(e)) e = e.substring(n.raw.length), t.push(n); else if (this.state.inLink || !(n = this.tokenizer.url(e))) { if (r = e, this.options.extensions && this.options.extensions.startInline) { let t = 1 / 0; const n = e.slice(1); let s; this.options.extensions.startInline.forEach((e => { s = e.call({ lexer: this }, n), "number" == typeof s && s >= 0 && (t = Math.min(t, s)) })), t < 1 / 0 && t >= 0 && (r = e.substring(0, t + 1)) } if (n = this.tokenizer.inlineText(r)) e = e.substring(n.raw.length), "_" !== n.raw.slice(-1) && (o = n.raw.slice(-1)), l = !0, s = t[t.length - 1], s && "text" === s.type ? (s.raw += n.raw, s.text += n.text) : t.push(n); else if (e) { const t = "Infinite loop on byte: " + e.charCodeAt(0); if (this.options.silent) { console.error(t); break } throw new Error(t) } } else e = e.substring(n.raw.length), t.push(n); return t } } class te { options; parser; constructor(t) { this.options = t || e.defaults } space(e) { return "" } code({ text: e, lang: t, escaped: n }) { const s = (t || "").match(/^\S*/)?.[0], r = e.replace(/\n$/, "") + "\n"; return s ? '<pre><code class="language-' + c(s) + '">' + (n ? r : c(r, !0)) + "</code></pre>\n" : "<pre><code>" + (n ? r : c(r, !0)) + "</code></pre>\n" } blockquote({ tokens: e }) { return `<blockquote>\n${this.parser.parse(e)}</blockquote>\n` } html({ text: e }) { return e } heading({ tokens: e, depth: t }) { return `<h${t}>${this.parser.parseInline(e)}</h${t}>\n` } hr(e) { return "<hr>\n" } list(e) { const t = e.ordered, n = e.start; let s = ""; for (let t = 0; t < e.items.length; t++) { const n = e.items[t]; s += this.listitem(n) } const r = t ? "ol" : "ul"; return "<" + r + (t && 1 !== n ? ' start="' + n + '"' : "") + ">\n" + s + "</" + r + ">\n" } listitem(e) { let t = ""; if (e.task) { const n = this.checkbox({ checked: !!e.checked }); e.loose ? e.tokens.length > 0 && "paragraph" === e.tokens[0].type ? (e.tokens[0].text = n + " " + e.tokens[0].text, e.tokens[0].tokens && e.tokens[0].tokens.length > 0 && "text" === e.tokens[0].tokens[0].type && (e.tokens[0].tokens[0].text = n + " " + e.tokens[0].tokens[0].text)) : e.tokens.unshift({ type: "text", raw: n + " ", text: n + " " }) : t += n + " " } return t += this.parser.parse(e.tokens, !!e.loose), `<li>${t}</li>\n` } checkbox({ checked: e }) { return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox">' } paragraph({ tokens: e }) { return `<p>${this.parser.parseInline(e)}</p>\n` } table(e) { let t = "", n = ""; for (let t = 0; t < e.header.length; t++)n += this.tablecell(e.header[t]); t += this.tablerow({ text: n }); let s = ""; for (let t = 0; t < e.rows.length; t++) { const r = e.rows[t]; n = ""; for (let e = 0; e < r.length; e++)n += this.tablecell(r[e]); s += this.tablerow({ text: n }) } return s && (s = `<tbody>${s}</tbody>`), "<table>\n<thead>\n" + t + "</thead>\n" + s + "</table>\n" } tablerow({ text: e }) { return `<tr>\n${e}</tr>\n` } tablecell(e) { const t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td"; return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>\n` } strong({ tokens: e }) { return `<strong>${this.parser.parseInline(e)}</strong>` } em({ tokens: e }) { return `<em>${this.parser.parseInline(e)}</em>` } codespan({ text: e }) { return `<code>${e}</code>` } br(e) { return "<br>" } del({ tokens: e }) { return `<del>${this.parser.parseInline(e)}</del>` } link({ href: e, title: t, tokens: n }) { const s = this.parser.parseInline(n), r = u(e); if (null === r) return s; let i = '<a href="' + (e = r) + '"'; return t && (i += ' title="' + t + '"'), i += ">" + s + "</a>", i } image({ href: e, title: t, text: n }) { const s = u(e); if (null === s) return n; let r = `<img src="${e = s}" alt="${n}"`; return t && (r += ` title="${t}"`), r += ">", r } text(e) { return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : e.text } } class ne { strong({ text: e }) { return e } em({ text: e }) { return e } codespan({ text: e }) { return e } del({ text: e }) { return e } html({ text: e }) { return e } text({ text: e }) { return e } link({ text: e }) { return "" + e } image({ text: e }) { return "" + e } br() { return "" } } class se { options; renderer; textRenderer; constructor(t) { this.options = t || e.defaults, this.options.renderer = this.options.renderer || new te, this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new ne } static parse(e, t) { return new se(t).parse(e) } static parseInline(e, t) { return new se(t).parseInline(e) } parse(e, t = !0) { let n = ""; for (let s = 0; s < e.length; s++) { const r = e[s]; if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) { const e = r, t = this.options.extensions.renderers[e.type].call({ parser: this }, e); if (!1 !== t || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(e.type)) { n += t || ""; continue } } const i = r; switch (i.type) { case "space": n += this.renderer.space(i); continue; case "hr": n += this.renderer.hr(i); continue; case "heading": n += this.renderer.heading(i); continue; case "code": n += this.renderer.code(i); continue; case "table": n += this.renderer.table(i); continue; case "blockquote": n += this.renderer.blockquote(i); continue; case "list": n += this.renderer.list(i); continue; case "html": n += this.renderer.html(i); continue; case "paragraph": n += this.renderer.paragraph(i); continue; case "text": { let r = i, l = this.renderer.text(r); for (; s + 1 < e.length && "text" === e[s + 1].type;)r = e[++s], l += "\n" + this.renderer.text(r); n += t ? this.renderer.paragraph({ type: "paragraph", raw: l, text: l, tokens: [{ type: "text", raw: l, text: l }] }) : l; continue } default: { const e = 'Token with "' + i.type + '" type was not found.'; if (this.options.silent) return console.error(e), ""; throw new Error(e) } } } return n } parseInline(e, t) { t = t || this.renderer; let n = ""; for (let s = 0; s < e.length; s++) { const r = e[s]; if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[r.type]) { const e = this.options.extensions.renderers[r.type].call({ parser: this }, r); if (!1 !== e || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) { n += e || ""; continue } } const i = r; switch (i.type) { case "escape": case "text": n += t.text(i); break; case "html": n += t.html(i); break; case "link": n += t.link(i); break; case "image": n += t.image(i); break; case "strong": n += t.strong(i); break; case "em": n += t.em(i); break; case "codespan": n += t.codespan(i); break; case "br": n += t.br(i); break; case "del": n += t.del(i); break; default: { const e = 'Token with "' + i.type + '" type was not found.'; if (this.options.silent) return console.error(e), ""; throw new Error(e) } } } return n } } class re { options; block; constructor(t) { this.options = t || e.defaults } static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens"]); preprocess(e) { return e } postprocess(e) { return e } processAllTokens(e) { return e } provideLexer() { return this.block ? ee.lex : ee.lexInline } provideParser() { return this.block ? se.parse : se.parseInline } } class ie { defaults = { async: !1, breaks: !1, extensions: null, gfm: !0, hooks: null, pedantic: !1, renderer: null, silent: !1, tokenizer: null, walkTokens: null }; options = this.setOptions; parse = this.parseMarkdown(!0); parseInline = this.parseMarkdown(!1); Parser = se; Renderer = te; TextRenderer = ne; Lexer = ee; Tokenizer = x; Hooks = re; constructor(...e) { this.use(...e) } walkTokens(e, t) { let n = []; for (const s of e) switch (n = n.concat(t.call(this, s)), s.type) { case "table": { const e = s; for (const s of e.header) n = n.concat(this.walkTokens(s.tokens, t)); for (const s of e.rows) for (const e of s) n = n.concat(this.walkTokens(e.tokens, t)); break } case "list": { const e = s; n = n.concat(this.walkTokens(e.items, t)); break } default: { const e = s; this.defaults.extensions?.childTokens?.[e.type] ? this.defaults.extensions.childTokens[e.type].forEach((s => { const r = e[s].flat(1 / 0); n = n.concat(this.walkTokens(r, t)) })) : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t))) } }return n } use(...e) { const t = this.defaults.extensions || { renderers: {}, childTokens: {} }; return e.forEach((e => { const n = { ...e }; if (n.async = this.defaults.async || n.async || !1, e.extensions && (e.extensions.forEach((e => { if (!e.name) throw new Error("extension name required"); if ("renderer" in e) { const n = t.renderers[e.name]; t.renderers[e.name] = n ? function (...t) { let s = e.renderer.apply(this, t); return !1 === s && (s = n.apply(this, t)), s } : e.renderer } if ("tokenizer" in e) { if (!e.level || "block" !== e.level && "inline" !== e.level) throw new Error("extension level must be 'block' or 'inline'"); const n = t[e.level]; n ? n.unshift(e.tokenizer) : t[e.level] = [e.tokenizer], e.start && ("block" === e.level ? t.startBlock ? t.startBlock.push(e.start) : t.startBlock = [e.start] : "inline" === e.level && (t.startInline ? t.startInline.push(e.start) : t.startInline = [e.start])) } "childTokens" in e && e.childTokens && (t.childTokens[e.name] = e.childTokens) })), n.extensions = t), e.renderer) { const t = this.defaults.renderer || new te(this.defaults); for (const n in e.renderer) { if (!(n in t)) throw new Error(`renderer '${n}' does not exist`); if (["options", "parser"].includes(n)) continue; const s = n, r = e.renderer[s], i = t[s]; t[s] = (...e) => { let n = r.apply(t, e); return !1 === n && (n = i.apply(t, e)), n || "" } } n.renderer = t } if (e.tokenizer) { const t = this.defaults.tokenizer || new x(this.defaults); for (const n in e.tokenizer) { if (!(n in t)) throw new Error(`tokenizer '${n}' does not exist`); if (["options", "rules", "lexer"].includes(n)) continue; const s = n, r = e.tokenizer[s], i = t[s]; t[s] = (...e) => { let n = r.apply(t, e); return !1 === n && (n = i.apply(t, e)), n } } n.tokenizer = t } if (e.hooks) { const t = this.defaults.hooks || new re; for (const n in e.hooks) { if (!(n in t)) throw new Error(`hook '${n}' does not exist`); if (["options", "block"].includes(n)) continue; const s = n, r = e.hooks[s], i = t[s]; re.passThroughHooks.has(n) ? t[s] = e => { if (this.defaults.async) return Promise.resolve(r.call(t, e)).then((e => i.call(t, e))); const n = r.call(t, e); return i.call(t, n) } : t[s] = (...e) => { let n = r.apply(t, e); return !1 === n && (n = i.apply(t, e)), n } } n.hooks = t } if (e.walkTokens) { const t = this.defaults.walkTokens, s = e.walkTokens; n.walkTokens = function (e) { let n = []; return n.push(s.call(this, e)), t && (n = n.concat(t.call(this, e))), n } } this.defaults = { ...this.defaults, ...n } })), this } setOptions(e) { return this.defaults = { ...this.defaults, ...e }, this } lexer(e, t) { return ee.lex(e, t ?? this.defaults) } parser(e, t) { return se.parse(e, t ?? this.defaults) } parseMarkdown(e) { return (t, n) => { const s = { ...n }, r = { ...this.defaults, ...s }, i = this.onError(!!r.silent, !!r.async); if (!0 === this.defaults.async && !1 === s.async) return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.")); if (null == t) return i(new Error("marked(): input parameter is undefined or null")); if ("string" != typeof t) return i(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(t) + ", string expected")); r.hooks && (r.hooks.options = r, r.hooks.block = e); const l = r.hooks ? r.hooks.provideLexer() : e ? ee.lex : ee.lexInline, o = r.hooks ? r.hooks.provideParser() : e ? se.parse : se.parseInline; if (r.async) return Promise.resolve(r.hooks ? r.hooks.preprocess(t) : t).then((e => l(e, r))).then((e => r.hooks ? r.hooks.processAllTokens(e) : e)).then((e => r.walkTokens ? Promise.all(this.walkTokens(e, r.walkTokens)).then((() => e)) : e)).then((e => o(e, r))).then((e => r.hooks ? r.hooks.postprocess(e) : e)).catch(i); try { r.hooks && (t = r.hooks.preprocess(t)); let e = l(t, r); r.hooks && (e = r.hooks.processAllTokens(e)), r.walkTokens && this.walkTokens(e, r.walkTokens); let n = o(e, r); return r.hooks && (n = r.hooks.postprocess(n)), n } catch (e) { return i(e) } } } onError(e, t) { return n => { if (n.message += "\nPlease report this to https://github.com/markedjs/marked.", e) { const e = "<p>An error occurred:</p><pre>" + c(n.message + "", !0) + "</pre>"; return t ? Promise.resolve(e) : e } if (t) return Promise.reject(n); throw n } } } const le = new ie; function oe(e, t) { return le.parse(e, t) } oe.options = oe.setOptions = function (e) { return le.setOptions(e), oe.defaults = le.defaults, n(oe.defaults), oe }, oe.getDefaults = t, oe.defaults = e.defaults, oe.use = function (...e) { return le.use(...e), oe.defaults = le.defaults, n(oe.defaults), oe }, oe.walkTokens = function (e, t) { return le.walkTokens(e, t) }, oe.parseInline = le.parseInline, oe.Parser = se, oe.parser = se.parse, oe.Renderer = te, oe.TextRenderer = ne, oe.Lexer = ee, oe.lexer = ee.lex, oe.Tokenizer = x, oe.Hooks = re, oe.parse = oe; const ae = oe.options, ce = oe.setOptions, he = oe.use, pe = oe.walkTokens, ue = oe.parseInline, ke = oe, ge = se.parse, fe = ee.lex; e.Hooks = re, e.Lexer = ee, e.Marked = ie, e.Parser = se, e.Renderer = te, e.TextRenderer = ne, e.Tokenizer = x, e.getDefaults = t, e.lexer = fe, e.marked = oe, e.options = ae, e.parse = ke, e.parseInline = ue, e.parser = ge, e.setOptions = ce, e.use = he, e.walkTokens = pe }));


    /**
     * Indux Components Plugin
     */

    // At the very top of the file, before any DOM mutation or plugin logic
    if (!window.__induxBodyOrder) {
        try {
            const req = new XMLHttpRequest();
            req.open('GET', '/index.html', false);
            req.send(null);
            if (req.status === 200) {
                let html = req.responseText;
                // Replace all self-closing custom tags with open/close tags, handling spaces before />
                html = html.replace(/<x-([a-z0-9-]+)([^>]*)\s*\/?>/gi, (match, tag, attrs) => `<x-${tag}${attrs}></x-${tag}>`);
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const bodyChildren = Array.from(doc.body.children);
                window.__induxBodyOrder = bodyChildren.map(el => ({
                    tag: el.tagName.toLowerCase().trim(),
                    isComponent: el.tagName.toLowerCase().startsWith('x-'),
                    attrs: Array.from(el.attributes).map(attr => [attr.name, attr.value]),
                    key: el.getAttribute('data-component-id') || (el.tagName.toLowerCase().startsWith('x-') ? el.tagName.toLowerCase().replace('x-', '').trim() : null)
                }));
            }
        } catch (e) {
            // Only log actual errors
            console.error('[Indux Debug] Failed to load index.html for body order snapshot', e);
        }
    }

    // Add style to make placeholders invisible and take up no space
    const style = document.createElement('style');
    style.textContent = `
    [is-void] { 
        display: none !important;
        margin: 0 !important;
        padding: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
    }
    [data-pre-rendered] { 
        opacity: 0;
        transition: opacity 0.3s ease-in;
    }
    [data-pre-rendered][data-ready] { 
        opacity: 1;
    }
`;
    document.head.appendChild(style);

    // Synchronously preload common components
    (function preloadCommonComponents() {
        // Force complete reload
        const timestamp = Date.now();

        // Load manifest synchronously with cache busting
        const manifestRequest = new XMLHttpRequest();
        manifestRequest.open('GET', '/manifest.json?t=' + timestamp, false); // false makes it synchronous
        manifestRequest.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        manifestRequest.setRequestHeader('Pragma', 'no-cache');
        manifestRequest.setRequestHeader('Expires', '0');
        manifestRequest.send(null);

        if (manifestRequest.status === 200) {
            window.manifest = JSON.parse(manifestRequest.responseText);

            if (window.manifest?.commonComponents) {
                // Load all common components synchronously
                window.manifest.commonComponents.forEach(path => {
                    const name = path.split('/').pop().replace('.html', '');
                    const componentRequest = new XMLHttpRequest();
                    componentRequest.open('GET', '/' + path + '?t=' + timestamp, false); // false makes it synchronous
                    componentRequest.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    componentRequest.setRequestHeader('Pragma', 'no-cache');
                    componentRequest.setRequestHeader('Expires', '0');
                    componentRequest.send(null);

                    if (componentRequest.status === 200) {
                        // Store in window for later use
                        window.__induxCommonComponents = window.__induxCommonComponents || {};
                        window.__induxCommonComponents[name] = componentRequest.responseText;

                        // Find and replace placeholder elements with actual content
                        const placeholders = document.getElementsByTagName(`x-${name}`);
                        Array.from(placeholders).forEach(placeholder => {
                            const container = document.createElement('div');
                            container.innerHTML = componentRequest.responseText.trim();
                            const content = container.firstElementChild;

                            // Copy attributes from placeholder
                            Array.from(placeholder.attributes).forEach(attr => {
                                if (attr.name === 'class') {
                                    const existingClass = content.getAttribute('class') || '';
                                    content.setAttribute('class', `${existingClass} ${attr.value}`.trim());
                                } else {
                                    content.setAttribute(attr.name, attr.value);
                                }
                            });

                            // Mark as pre-rendered
                            content.setAttribute('data-pre-rendered', '');
                            // Add data-component-id for efficient navigation cleanup
                            content.setAttribute('data-component-id', name);

                            // Replace placeholder with content
                            placeholder.parentNode.replaceChild(content, placeholder);

                            // Mark as ready to fade in after a small delay
                            requestAnimationFrame(() => {
                                content.setAttribute('data-ready', '');
                            });
                        });
                    }
                });
            }
        }
    })();

    // Initialize plugin when Alpine is ready
    function initializePlugin() {
        // Initialize Alpine store for components
        Alpine.store('components', {
            cache: window.__induxCommonComponents || {},
            registered: new Set(),
            initialized: false
        });

        // Register components from manifest
        async function registerComponents() {
            // Use preloaded manifest
            if (!window.manifest) {
                console.error('[Indux Components] Manifest not found');
                return;
            }

            const store = Alpine.store('components');

            // Register all components in a single pass
            const allComponents = [
                ...(window.manifest?.commonComponents || []),
                ...(window.manifest?.components || [])
            ];

            // Register all components first
            const registrations = allComponents.map(path => {
                const name = path.split('/').pop().replace('.html', '');
                store.registered.add(name);
                const tag = `x-${name}`;
                if (!window.customElements.get(tag)) {
                    return new Promise(resolve => {
                        class CustomElement extends HTMLElement {
                            constructor() {
                                super();
                            }
                            connectedCallback() {
                                this.setAttribute('is-void', '');
                            }
                        }
                        window.customElements.define(tag, CustomElement);
                        // Wait for the next microtask to ensure definition is complete
                        queueMicrotask(() => resolve());
                    });
                }
                return Promise.resolve();
            });

            // Wait for all registrations to complete
            await Promise.all(registrations);
        }

        // Find components used in the DOM
        function findUsedComponents(node) {
            const usedComponents = new Set();

            function scan(node) {
                if (node.nodeType !== 1) return;

                if (node.tagName?.toLowerCase().startsWith('x-')) {
                    const componentName = node.tagName.toLowerCase().replace('x-', '');
                    usedComponents.add(componentName);
                }

                Array.from(node.children || []).forEach(scan);
            }

            scan(node);
            return usedComponents;
        }

        // Load component from manifest
        async function loadComponent(name) {
            const store = Alpine.store('components');

            // Check cache first
            if (store.cache[name]) {
                return store.cache[name];
            }

            // Find component path in manifest
            const path = window.manifest?.commonComponents?.find(p =>
                p.split('/').pop().replace('.html', '') === name
            ) || window.manifest?.components?.find(p =>
                p.split('/').pop().replace('.html', '') === name
            );

            if (!path) {
                console.error(`[Indux Components] No path found for component: ${name}`);
                return null;
            }

            try {
                const response = await fetch('/' + path);
                if (!response.ok) throw new Error(`Failed to load component: ${name}`);
                const content = await response.text();
                store.cache[name] = content;
                return content;
            } catch (error) {
                console.error(`[Indux Components] Error loading component ${name}:`, error);
                return null;
            }
        }

        // Process a single component
        async function processComponent(element) {
            const name = element.tagName.toLowerCase().replace('x-', '');
            const store = Alpine.store('components');

            // Skip if component was pre-rendered or already processed
            if (element.hasAttribute('data-pre-rendered') || element.hasAttribute('data-processed')) {
                return;
            }

            // Check if component is registered
            if (!store.registered.has(name)) {
                console.warn(`[Indux Components] Component not registered: ${name}`);
                return;
            }

            // Check x-route condition if present
            const routeCondition = element.getAttribute('x-route');
            if (routeCondition) {
                const currentPath = window.location.pathname;
                const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

                // Split into positive and negative conditions
                const conditions = routeCondition.split(',').map(cond => cond.trim());
                const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                const negativeConditions = conditions
                    .filter(cond => cond.startsWith('!'))
                    .map(cond => cond.slice(1));

                // Helper to check if a path matches a condition
                const matchesCondition = (path, condition) => {
                    // Normalize condition (remove leading/trailing slashes)
                    const normalizedCondition = condition.replace(/^\/|\/$/g, '');

                    // Special case for root
                    if (condition === '/' && path === '/') return true;

                    // Check if path starts with condition or matches exactly
                    return path === normalizedCondition ||
                        path.startsWith(`${normalizedCondition}/`) ||
                        path === `/${normalizedCondition}`;
                };

                // Check if any negative condition matches
                const hasNegativeMatch = negativeConditions.some(cond =>
                    matchesCondition(normalizedPath, cond)
                );

                // Check if any positive condition matches
                const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                    matchesCondition(normalizedPath, cond)
                );

                // Show if there's a positive match and no negative match
                const shouldShow = hasPositiveMatch && !hasNegativeMatch;

                if (!shouldShow) {
                    // For components, handle head content and children
                    if (element.tagName.toLowerCase().startsWith('x-')) {
                        // Remove head content if component is being removed
                        const existingHead = document.head.querySelector(`[data-component-head="${name}"]`);
                        if (existingHead) {
                            existingHead.remove();
                        }

                        // Find and remove all rendered content for this component
                        const renderedContent = document.querySelectorAll(`[data-component="${name}"]`);
                        renderedContent.forEach(content => {
                            content.remove();
                        });

                        // Preserve children before removing component
                        const parent = element.parentElement;
                        if (parent) {
                            const children = Array.from(element.children);
                            children.forEach(child => parent.insertBefore(child, element));
                            element.remove();
                        }
                    } else {
                        // For static elements, just hide them
                        element.style.display = 'none';
                    }
                    return;
                } else if (!element.tagName.toLowerCase().startsWith('x-')) {
                    // For static elements that should be shown, ensure they're visible
                    element.style.display = '';
                }
            }

            const content = await loadComponent(name);
            if (!content) {
                console.error(`[Indux Components] Failed to load content for: ${name}`);
                element.replaceWith(document.createComment(` Failed to load component: ${name} `));
                return;
            }

            // Create container and parse content
            const container = document.createElement('div');
            container.innerHTML = content.trim();

            // Handle head content if present (for any component)
            const headTemplate = container.querySelector('template[data-head]');
            if (headTemplate) {
                // Remove any existing head content for this component
                const existingHead = document.head.querySelector(`[data-component-head="${name}"]`);
                if (existingHead) {
                    existingHead.remove();
                }

                // Move each child from template to document head
                while (headTemplate.content.firstChild) {
                    const child = headTemplate.content.firstChild;
                    // Skip empty text nodes
                    if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) {
                        headTemplate.content.removeChild(child);
                        continue;
                    }
                    // Only set attribute on element nodes
                    if (child.nodeType === Node.ELEMENT_NODE) {
                        child.setAttribute('data-component-head', name);
                    }
                    document.head.appendChild(child);
                }

                // Remove the template from the container
                headTemplate.parentNode.removeChild(headTemplate);
            }

            // Get all top-level elements, excluding any head templates
            const topLevelElements = Array.from(container.children).filter(el =>
                !(el.tagName.toLowerCase() === 'template' && el.hasAttribute('data-head'))
            );

            if (topLevelElements.length === 0) {
                console.error(`[Indux Components] No content in component: ${name}`);
                element.replaceWith(document.createComment(` Empty component: ${name} `));
                return;
            }

            // Get the parent element
            const parent = element.parentElement;
            if (!parent || !document.contains(element)) {
                return;
            }

            // Create a document fragment to hold all top-level elements
            const fragment = document.createDocumentFragment();
            topLevelElements.forEach(el => {
                // Mark rendered content with data-component attribute
                el.setAttribute('data-component', name);
                // Add data-component-id for efficient navigation cleanup
                el.setAttribute('data-component-id', name);
                fragment.appendChild(el);
            });

            // Insert the fragment before the original element
            parent.insertBefore(fragment, element);

            // Collect all children in an array to preserve order
            const children = Array.from(element.children);

            // Reverse the array to fix the order
            children.reverse();

            // Insert children in the correct order
            children.forEach(child => {
                parent.insertBefore(child, element.nextSibling);
            });

            // Mark as processed before removing
            element.setAttribute('data-processed', '');

            // Remove the original element
            element.remove();

            // Process any nested components in the inserted content
            const nestedComponents = Array.from(parent.getElementsByTagName('*'))
                .filter(el => el.tagName.toLowerCase().startsWith('x-'))
                .filter(el => !el.hasAttribute('data-pre-rendered'))
                .filter(el => !el.hasAttribute('data-processed'))
                .filter(el => el.parentElement === parent); // Only process direct children

            // Process nested components
            for (const nestedComponent of nestedComponents) {
                await processComponent(nestedComponent);
            }
        }

        // Initialize plugin
        async function initializeComponentsPlugin() {
            if (Alpine.store('components').initialized) return;

            try {
                // Register components first
                await registerComponents();

                // Helper to check if a path matches a condition
                const matchesCondition = (path, condition) => {
                    // Normalize condition (remove leading/trailing slashes)
                    const normalizedCondition = condition.replace(/^\/|\/$/g, '');

                    // Special case for root
                    if (condition === '/' && path === '/') return true;

                    // Check if path starts with condition or matches exactly
                    return path === normalizedCondition ||
                        path.startsWith(`${normalizedCondition}/`) ||
                        path === `/${normalizedCondition}`;
                };

                // Process all elements with x-route first
                const processRouteElements = () => {
                    // Create a document fragment for batch DOM operations
                    const fragment = document.createDocumentFragment();
                    const routeElements = document.querySelectorAll('[x-route]');
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');

                    // First, clean up any existing components that shouldn't be visible
                    document.querySelectorAll('[data-component-head]').forEach(head => {
                        const componentName = head.getAttribute('data-component-head');
                        const component = document.querySelector(`x-${componentName}`);
                        if (component) {
                            const routeCondition = component.getAttribute('x-route');
                            if (routeCondition) {
                                const conditions = routeCondition.split(',').map(cond => cond.trim());
                                const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                                const negativeConditions = conditions
                                    .filter(cond => cond.startsWith('!'))
                                    .map(cond => cond.slice(1));

                                const hasNegativeMatch = negativeConditions.some(cond =>
                                    matchesCondition(normalizedPath, cond)
                                );
                                const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                                    matchesCondition(normalizedPath, cond)
                                );

                                if (!hasPositiveMatch || hasNegativeMatch) {
                                    head.remove();
                                }
                            }
                        }
                    });

                    // Process all route elements in one pass
                    routeElements.forEach(element => {
                        const routeCondition = element.getAttribute('x-route');
                        if (!routeCondition) return;

                        const conditions = routeCondition.split(',').map(cond => cond.trim());
                        const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                        const negativeConditions = conditions
                            .filter(cond => cond.startsWith('!'))
                            .map(cond => cond.slice(1));

                        const hasNegativeMatch = negativeConditions.some(cond =>
                            matchesCondition(normalizedPath, cond)
                        );
                        const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond =>
                            matchesCondition(normalizedPath, cond)
                        );

                        // Use classList for better performance
                        if (hasPositiveMatch && !hasNegativeMatch) {
                            element.classList.remove('hidden');
                        } else {
                            element.classList.add('hidden');
                        }
                    });
                };

                // Find components actually used in the DOM
                const usedComponents = findUsedComponents(document.body);

                // Load only non-cached components
                if (usedComponents.size > 0) {
                    const store = Alpine.store('components');
                    const componentsToLoad = Array.from(usedComponents)
                        .filter(name => !store.cache[name]);

                    if (componentsToLoad.length > 0) {
                        await Promise.all(componentsToLoad.map(name => loadComponent(name)));
                    }
                }

                // Add style for route visibility
                const style = document.createElement('style');
                style.textContent = '.hidden { display: none !important; }';
                document.head.appendChild(style);

                // Initial processing - routes first, then components
                processRouteElements();
                await processComponentsInOrder();

                // Set up mutation observer for dynamic elements
                let mutationPending = false;
                const observer = new MutationObserver(mutations => {
                    if (mutationPending) return;
                    mutationPending = true;
                    requestAnimationFrame(async () => {
                        mutationPending = false;
                        const newComponents = new Set();
                        let hasRouteElements = false;
                        mutations.forEach(mutation => {
                            mutation.addedNodes.forEach(node => {
                                if (node.nodeType === 1) {
                                    if (node.hasAttribute('x-route') || node.querySelector('[x-route]')) {
                                        hasRouteElements = true;
                                    }
                                    Array.from(node.querySelectorAll('[is-void]'))
                                        .filter(el => el.tagName.toLowerCase().startsWith('x-') && document.contains(el))
                                        .forEach(el => newComponents.add(el));
                                }
                            });
                        });
                        if (hasRouteElements) {
                            processRouteElements();
                        }
                        if (newComponents.size > 0) {
                            await processComponentsInOrder();
                        }
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Helper to clean up components
                const cleanupComponents = (currentPath, normalizedPath) => {
                    // First, remove all rendered content
                    document.querySelectorAll('[data-component]').forEach(content => {
                        const componentName = content.getAttribute('data-component');
                        content.remove();
                    });

                    // Then remove all head content
                    document.querySelectorAll('[data-component-head]').forEach(head => {
                        head.remove();
                    });

                    // Remove all popover elements
                    document.querySelectorAll('[popover]').forEach(popover => {
                        popover.remove();
                    });

                    // Finally, remove all components
                    document.querySelectorAll('[is-void]').forEach(component => {
                        component.remove();
                    });

                    // Clean up any static elements with x-route that shouldn't be visible
                    const routeElements = document.querySelectorAll('[x-route]');
                    routeElements.forEach(element => {
                        const routeCondition = element.getAttribute('x-route');
                        if (!routeCondition) return;

                        if (!matchesCondition(normalizedPath, routeCondition)) {
                            element.classList.add('hidden');
                        } else {
                            element.classList.remove('hidden');
                        }
                    });
                };

                // Helper: get desired body order for current route
                function getDesiredBodyOrder(normalizedPath) {
                    // Use the initial body order as the template
                    const initialOrder = window.__induxBodyOrder;
                    // Determine which components should be present for this route
                    const store = Alpine.store('components');
                    const registeredComponents = Array.from(store.registered);
                    const commonComponents = registeredComponents.filter(name =>
                        window.manifest?.commonComponents?.some(path =>
                            path.split('/').pop().replace('.html', '') === name
                        )
                    );
                    const routeComponents = registeredComponents.filter(name =>
                        window.manifest?.pages?.some(page =>
                            page.path.split('/').pop().replace('.html', '') === name &&
                            (page.url === window.location.pathname || page.url === normalizedPath)
                        )
                    );
                    // Build a set for quick lookup
                    const shouldHave = new Set([...commonComponents, ...routeComponents]);
                    // Build the desired order: static elements as in initialOrder, components only if shouldHave AND x-route matches
                    const desired = initialOrder.map(item => {
                        if (item.isComponent) {
                            const name = item.key;
                            if (!shouldHave.has(name)) { return null; }
                            // Check x-route condition if present
                            let xRoute = null;
                            for (const [k, v] of item.attrs) {
                                if (k === 'x-route') xRoute = v;
                            }
                            if (xRoute) {
                                const conditions = xRoute.split(',').map(cond => cond.trim());
                                const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                                const negativeConditions = conditions.filter(cond => cond.startsWith('!')).map(cond => cond.slice(1));
                                const hasNegativeMatch = negativeConditions.some(cond => matchesCondition(normalizedPath, cond));
                                const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => matchesCondition(normalizedPath, cond));
                                if (!hasPositiveMatch || hasNegativeMatch) { return null; }
                            }
                            // For route components, update x-route attr
                            const attrs = item.attrs.filter(([k]) => k !== 'x-route');
                            if (routeComponents.includes(name)) {
                                attrs.push(['x-route', normalizedPath]);
                            }
                            return { ...item, attrs };
                        } else {
                            return item; // static element
                        }
                    }).filter(Boolean);
                    return desired;
                }

                // Utility: Attribute comparison using Map for O(1) lookups
                function attrsEqual(a, b) {
                    if (a.length !== b.length) return false;
                    const mapA = new Map(a);
                    for (const [k, v] of b) {
                        if (mapA.get(k) !== v) return false;
                    }
                    return true;
                }

                // Consolidated processComponentsInOrder (top-level, async)
                async function processComponentsInOrder() {
                    const components = Array.from(document.querySelectorAll('[is-void]'))
                        .filter(el => el.tagName.toLowerCase().startsWith('x-') && document.contains(el));
                    // Helper to get element depth
                    const getElementDepth = (element) => {
                        let depth = 0;
                        let current = element;
                        while (current.parentElement) {
                            depth++;
                            current = current.parentElement;
                        }
                        return depth;
                    };
                    // Sort components by depth (shallowest first)
                    components.sort((a, b) => getElementDepth(a) - getElementDepth(b));
                    for (const element of components) {
                        if (!document.contains(element)) continue;
                        await processComponent(element);
                    }
                    // After processing all components, check for any nested components that might have been missed
                    const remainingComponents = Array.from(document.querySelectorAll('[is-void]'))
                        .filter(el => el.tagName.toLowerCase().startsWith('x-') && document.contains(el));
                    if (remainingComponents.length > 0) {
                        await processComponentsInOrder();
                    }
                }

                // In reconcileBody, build a map of component IDs to elements and avoid redundant DOM moves
                async function reconcileBody(normalizedPath) {
                    const desired = getDesiredBodyOrder(normalizedPath);
                    // Build a map of component keys to elements for quick lookup
                    const elementMap = new Map();
                    Array.from(document.body.children).forEach(el => {
                        const key = el.getAttribute && el.getAttribute('data-component-id');
                        if (key) elementMap.set(key, el);
                    });
                    let domIdx = 0;
                    for (let i = 0; i < desired.length; i++) {
                        const item = desired[i];
                        let node = document.body.children[domIdx];
                        // If node matches desired item and is in correct position, move on
                        if (node && node.tagName.toLowerCase() === item.tag && attrsEqual(Array.from(node.attributes).map(a => [a.name, a.value]), item.attrs)) {
                            domIdx++;
                            continue;
                        }
                        if (item.isComponent) {
                            // Use the map for quick lookup
                            const el = elementMap.get(item.key);
                            if (el && el !== node) {
                                document.body.insertBefore(el, node || null);
                                domIdx++;
                            } else if (!el) {
                                const newEl = document.createElement(item.tag);
                                item.attrs.forEach(([k, v]) => newEl.setAttribute(k, v));
                                document.body.insertBefore(newEl, node || null);
                                domIdx++;
                            } else {
                                domIdx++;
                            }
                        } else {
                            while (node && node.tagName.toLowerCase().startsWith('x-')) {
                                node.remove();
                                node = document.body.children[domIdx];
                            }
                            domIdx++;
                        }
                    }
                    // Remove any extra trailing components
                    while (document.body.children.length > desired.length) {
                        const node = document.body.children[desired.length];
                        if (node.tagName.toLowerCase().startsWith('x-')) {
                            node.remove();
                        } else break;
                    }
                }

                // Handle SPA navigation
                document.addEventListener('click', async (e) => {
                    const anchor = e.target.closest('a');
                    if (!anchor) return;
                    const href = anchor.getAttribute('href');
                    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
                    e.preventDefault();
                    history.pushState(null, '', href);
                    await new Promise(resolve => setTimeout(resolve, 0));
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
                    document.querySelectorAll('[x-route]').forEach(element => {
                        const routeCondition = element.getAttribute('x-route');
                        if (!routeCondition) return;
                        const conditions = routeCondition.split(',').map(cond => cond.trim());
                        const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                        const negativeConditions = conditions.filter(cond => cond.startsWith('!')).map(cond => cond.slice(1));
                        const hasNegativeMatch = negativeConditions.some(cond => matchesCondition(normalizedPath, cond));
                        const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => matchesCondition(normalizedPath, cond));
                        if (hasPositiveMatch && !hasNegativeMatch) {
                            element.classList.remove('hidden');
                        } else {
                            element.classList.add('hidden');
                        }
                    });
                    await updateComponentsForRoute(normalizedPath);
                    if (typeof processComponentsInOrder === 'function') {
                        await processComponentsInOrder();
                    } else {
                        const components = Array.from(document.querySelectorAll('[is-void]')).filter(el => el.tagName.toLowerCase().startsWith('x-') && document.contains(el));
                        for (const element of components) {
                            if (!document.contains(element)) continue;
                            await processComponent(element);
                        }
                    }
                });

                window.addEventListener('popstate', async () => {
                    await new Promise(resolve => setTimeout(resolve, 0));
                    const currentPath = window.location.pathname;
                    const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/^\/|\/$/g, '');
                    document.querySelectorAll('[x-route]').forEach(element => {
                        const routeCondition = element.getAttribute('x-route');
                        if (!routeCondition) return;
                        const conditions = routeCondition.split(',').map(cond => cond.trim());
                        const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
                        const negativeConditions = conditions.filter(cond => cond.startsWith('!')).map(cond => cond.slice(1));
                        const hasNegativeMatch = negativeConditions.some(cond => matchesCondition(normalizedPath, cond));
                        const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => matchesCondition(normalizedPath, cond));
                        if (hasPositiveMatch && !hasNegativeMatch) {
                            element.classList.remove('hidden');
                        } else {
                            element.classList.add('hidden');
                        }
                    });
                    await updateComponentsForRoute(normalizedPath);
                    if (typeof processComponentsInOrder === 'function') {
                        await processComponentsInOrder();
                    } else {
                        const components = Array.from(document.querySelectorAll('[is-void]')).filter(el => el.tagName.toLowerCase().startsWith('x-') && document.contains(el));
                        for (const element of components) {
                            if (!document.contains(element)) continue;
                            await processComponent(element);
                        }
                    }
                });

                // After cleanupComponents and before processing components:
                // Remove all <x-*> elements from <body>
                Array.from(document.body.children).forEach(el => {
                    if (el.tagName.toLowerCase().startsWith('x-')) el.remove();
                });
                // Re-insert components in the correct order
                let lastInserted = null;
                window.__induxBodyOrder.forEach((item, idx) => {
                    if (item.isComponent) {
                        if (typeof item.tag === 'string' && item.tag.trim().startsWith('x-')) {
                            let node = document.body.children[idx];
                            if (node && node.tagName.toLowerCase() === item.tag.trim() && node.getAttribute('data-component-id') === item.key) {
                                lastInserted = node;
                                return;
                            }
                            for (let j = idx + 1; j < document.body.children.length; j++) {
                                const test = document.body.children[j];
                                if (test.tagName.toLowerCase() === item.tag.trim() && test.getAttribute('data-component-id') === item.key) {
                                    test.remove();
                                }
                            }
                            // Guard: only create element if tag is valid
                            const tag = (item.tag || '').trim();
                            if (!tag || !/^x-[a-z0-9-]+$/i.test(tag)) return;
                            try {
                                const el = document.createElement(tag);
                                el.setAttribute('is-void', '');
                                el.setAttribute('data-component-id', item.key);
                                item.attrs.forEach(([name, value]) => {
                                    if (name && name !== 'data-component-id' && name !== 'is-void') {
                                        el.setAttribute(name, value);
                                    }
                                });
                                if (lastInserted && lastInserted.nextSibling) {
                                    document.body.insertBefore(el, lastInserted.nextSibling);
                                } else if (lastInserted) {
                                    document.body.appendChild(el);
                                } else {
                                    document.body.insertBefore(el, document.body.firstChild);
                                }
                                lastInserted = el;
                            } catch (err) {
                                console.error('[Indux] Failed to create element:', {
                                    tag,
                                    item,
                                    error: err.message
                                });
                            }
                        }
                    } else {
                        const staticEl = Array.from(document.body.children).find(child =>
                            child.tagName.toLowerCase() === item.tag.trim() &&
                            item.attrs.every(([name, value]) => child.getAttribute(name) === value)
                        );
                        if (staticEl) {
                            lastInserted = staticEl;
                        }
                    }
                });

                Alpine.store('components').initialized = true;
            } catch (error) {
                console.error('[Indux Components] Failed to initialize:', error);
            }
        }

        // Start initialization
        initializeComponentsPlugin();
    }

    // Check for Alpine and initialize
    function checkAlpine() {
        // Check for Alpine object or Alpine.init
        if (window.Alpine || (window.Alpine && window.Alpine.init)) {
            initializePlugin();
        } else {
            // Also check for alpine:init event
            document.addEventListener('alpine:init', () => {
                initializePlugin();
            }, { once: true });

            setTimeout(checkAlpine, 100);
        }
    }

    // Wait for DOM to be ready, then check for Alpine
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkAlpine();
        });
    } else {
        checkAlpine();
    }

    // Global error handler
    window.addEventListener('error', function (e) {
        console.error('[Indux Debug] Global error:', e.message, e);
    });

    // Unified route normalization and matching
    function normalizeRoute(route) {
        if (!route) return '/';
        // Remove leading/trailing slashes, but keep root as '/'
        const trimmed = route.trim();
        if (trimmed === '' || trimmed === '/') return '/';
        return trimmed.replace(/^\/+|\/+$/g, '');
    }
    function routeMatches(a, b) {
        // Normalize both sides
        const normA = normalizeRoute(a);
        const normB = normalizeRoute(b);
        // Root matches root
        if (normA === '/' && normB === '/') return true;
        // Exact match
        if (normA === normB) return true;
        // Allow /foo to match foo, /foo/, etc
        return normA === normB.replace(/^\/+|\/+$/g, '') || normB === normA.replace(/^\/+|\/+$/g, '');
    }

    async function updateComponentsForRoute(normalizedPath) {
        const store = Alpine.store('components');
        const registeredComponents = Array.from(store.registered);
        const commonComponents = registeredComponents.filter(name =>
            window.manifest?.commonComponents?.some(path =>
                path.split('/').pop().replace('.html', '') === name
            )
        );
        const routeComponents = registeredComponents.filter(name =>
            window.manifest?.pages?.some(page =>
                page.path.split('/').pop().replace('.html', '') === name &&
                routeMatches(page.url, normalizedPath)
            )
        );

        function shouldBeActive(name) {
            const originalComponent = window.__induxBodyOrder.find(item =>
                item.isComponent && item.key === name
            );
            if (!originalComponent) return false;
            const xRoute = originalComponent.attrs.find(([k]) => k === 'x-route')?.[1];
            if (!xRoute) return true;
            const conditions = xRoute.split(',').map(cond => cond.trim());
            const positiveConditions = conditions.filter(cond => !cond.startsWith('!'));
            const negativeConditions = conditions.filter(cond => cond.startsWith('!')).map(cond => cond.slice(1));
            const hasNegativeMatch = negativeConditions.some(cond => routeMatches(cond, normalizedPath));
            const hasPositiveMatch = positiveConditions.length === 0 || positiveConditions.some(cond => routeMatches(cond, normalizedPath));
            return hasPositiveMatch && !hasNegativeMatch;
        }

        const activeNames = [...commonComponents, ...routeComponents].filter(name => shouldBeActive(name));

        // Create a map of existing pre-rendered components
        const preRenderedMap = new Map();
        document.querySelectorAll('[data-pre-rendered]').forEach(el => {
            const componentId = el.getAttribute('data-component-id');
            if (componentId) {
                preRenderedMap.set(componentId, el);
            }
        });

        // Remove all non-pre-rendered components and their content
        Array.from(document.body.children).forEach(el => {
            if (el.tagName.toLowerCase().startsWith('x-') ||
                (el.hasAttribute('data-component') && !el.hasAttribute('data-pre-rendered'))) {
                el.remove();
            }
        });

        // Insert placeholders for all components in canonical order if they should be active
        let lastInserted = null;
        window.__induxBodyOrder.forEach((item, idx) => {
            if (item.isComponent) {
                const name = item.key;
                if (activeNames.includes(name)) {
                    // Check if we have a pre-rendered version
                    const preRendered = preRenderedMap.get(name);
                    if (preRendered) {
                        // Move pre-rendered component to correct position
                        if (lastInserted && lastInserted.nextSibling) {
                            document.body.insertBefore(preRendered, lastInserted.nextSibling);
                        } else if (lastInserted) {
                            document.body.appendChild(preRendered);
                        } else {
                            document.body.insertBefore(preRendered, document.body.firstChild);
                        }
                        lastInserted = preRendered;
                    } else {
                        // Create new placeholder if no pre-rendered version exists
                        const tag = (item.tag || '').trim();
                        if (!tag || !/^x-[a-z0-9-]+$/i.test(tag)) return;
                        try {
                            const el = document.createElement(tag);
                            el.setAttribute('is-void', '');
                            el.setAttribute('data-component-id', name);
                            item.attrs.forEach(([name, value]) => {
                                if (name && name !== 'data-component-id' && name !== 'is-void') {
                                    el.setAttribute(name, value);
                                }
                            });
                            if (lastInserted && lastInserted.nextSibling) {
                                document.body.insertBefore(el, lastInserted.nextSibling);
                            } else if (lastInserted) {
                                document.body.appendChild(el);
                            } else {
                                document.body.insertBefore(el, document.body.firstChild);
                            }
                            lastInserted = el;
                        } catch (err) {
                            console.error('[Indux] Failed to create element:', {
                                tag,
                                item,
                                error: err.message
                            });
                        }
                    }
                }
            } else {
                // Static element: ensure it is present and in correct order
                const staticEl = Array.from(document.body.children).find(child =>
                    child.tagName.toLowerCase() === item.tag &&
                    item.attrs.every(([k, v]) => child.getAttribute(k) === v)
                );
                if (staticEl) {
                    lastInserted = staticEl;
                }
            }
        });

        // Remove all rendered content and placeholders for components not in activeNames
        document.querySelectorAll('[data-component]').forEach(content => {
            const componentName = content.getAttribute('data-component');
            if (!activeNames.includes(componentName)) {
                content.remove();
            }
        });
        document.querySelectorAll('[is-void]').forEach(placeholder => {
            const componentName = placeholder.getAttribute('data-component-id');
            if (!activeNames.includes(componentName)) {
                placeholder.remove();
            }
        });
    }

    /**
     * Indux Carousel Plugin
     */

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
                            console.warn('[Indux Carousels] Carousel track element not found. Expected element with class "carousel-slides"');
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

    /**
     * Indux Collections Plugin
     */

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
                console.warn('[Indux Collections] Cache read failed:', error);
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
                console.warn('[Indux Collections] Cache write failed:', error);
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
                console.error('[Indux Collections] Failed to load manifest:', error);
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
                        console.warn(`[Indux Collections] Collection "${collectionName}" not found in manifest`);
                        return null;
                    }

                    // Handle both string paths and localized objects
                    let source;
                    if (typeof collection === 'string') {
                        source = collection;
                    } else if (collection[locale]) {
                        source = collection[locale];
                    } else if (collection.path) {
                        source = collection.path;
                    } else {
                        console.warn(`[Indux Collections] No source found for collection "${collectionName}" in locale "${locale}"`);
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
                        console.warn(`[Indux Collections] Unsupported content type for "${source}": ${contentType}`);
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
                    console.error(`[Indux Collections] Failed to load collection "${collectionName}":`, error);
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

                    return target[key];
                }
            });
        }

        // Add $x magic method first
        Alpine.magic('x', () => {
            const pendingLoads = new Map();
            const store = Alpine.store('collections');

            // Listen for locale changes
            window.addEventListener('localechange', async (event) => {
                const newLocale = event.detail.locale;

                // Clear existing collections
                Alpine.store('collections', { ...store, all: [] });

                // Reload all collections with new locale
                const manifest = await ensureManifest();
                if (manifest?.collections) {
                    for (const collectionName of Object.keys(manifest.collections)) {
                        await loadCollection(collectionName, newLocale);
                    }
                }
            });

            return new Proxy({}, {
                get(target, prop) {
                    // Handle special keys
                    if (prop === Symbol.iterator || prop === 'then' || prop === 'catch' || prop === 'finally') {
                        return undefined;
                    }

                    // Get current value from store
                    const value = store[prop];
                    const currentLocale = Alpine.store('locale').current;

                    // If not in store, try to load it
                    if (!value && !pendingLoads.has(prop)) {
                        // Start loading
                        const loadPromise = loadCollection(prop, currentLocale);
                        pendingLoads.set(prop, loadPromise);
                        return createLoadingProxy();
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
                                                return createLoadingProxy();
                                            }
                                        });
                                    }
                                    return new Proxy(nestedValue, {
                                        get(target, nestedKey) {
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
                                return createLoadingProxy();
                            }
                        });
                    }

                    return createLoadingProxy();
                }
            });
        });

        // Initialize collections after magic method is registered
        if (isInitializing || initializationComplete) return;
        isInitializing = true;

        try {
            // Get initial locale from HTML lang attribute
            const initialLocale = document.documentElement.lang || 'en';

            // Load collections
            const manifest = await ensureManifest();
            if (manifest?.collections) {
                const store = Alpine.store('collections');
                const all = [];

                for (const collectionName of Object.keys(manifest.collections)) {
                    const data = await loadCollection(collectionName, initialLocale);
                    if (data) {
                        store[collectionName] = data;
                        if (Array.isArray(data)) {
                            all.push(...data);
                        } else {
                            all.push(data);
                        }
                    }
                }

                // Update store once with all collections
                Alpine.store('collections', {
                    ...store,
                    all,
                    _initialized: true
                });
            }
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

    /**
     * Indux Dropdown Plugin
     */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeDropdownPlugin() {

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

        // Register dropdown directive
        Alpine.directive('dropdown', (el, { modifiers, expression }, { effect }) => {

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
                        console.warn(`[Indux Dropdowns] Dropdown menu with id "${dropdownId}" not found`);
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
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializeDropdownPlugin();
        });
    }

    document.addEventListener('alpine:init', initializeDropdownPlugin);

    var indux_icons = {};

    /**
     * Iconify
     * 
     * By Vjacheslav Trushkin
     * Provided under MIT License
     * https://github.com/iconify/iconify
     * 
     */

    var hasRequiredIndux_icons;

    function requireIndux_icons () {
    	if (hasRequiredIndux_icons) return indux_icons;
    	hasRequiredIndux_icons = 1;
    	(function (exports) {
    		var Iconify = function (t) { const e = Object.freeze({ left: 0, top: 0, width: 16, height: 16 }), n = Object.freeze({ rotate: 0, vFlip: !1, hFlip: !1 }), o = Object.freeze({ ...e, ...n }), r = Object.freeze({ ...o, body: "", hidden: !1 }); function i(t, e) { const o = function (t, e) { const n = {}; !t.hFlip != !e.hFlip && (n.hFlip = !0), !t.vFlip != !e.vFlip && (n.vFlip = !0); const o = ((t.rotate || 0) + (e.rotate || 0)) % 4; return o && (n.rotate = o), n }(t, e); for (const i in r) i in n ? i in t && !(i in o) && (o[i] = n[i]) : i in e ? o[i] = e[i] : i in t && (o[i] = t[i]); return o } function c(t, e, n) { const o = t.icons, r = t.aliases || Object.create(null); let c = {}; function s(t) { c = i(o[t] || r[t], c); } return s(e), n.forEach(s), i(t, c) } function s(t, e) { const n = []; if ("object" != typeof t || "object" != typeof t.icons) return n; t.not_found instanceof Array && t.not_found.forEach((t => { e(t, null), n.push(t); })); const o = function (t, e) { const n = t.icons, o = t.aliases || Object.create(null), r = Object.create(null); return (Object.keys(n).concat(Object.keys(o))).forEach((function t(e) { if (n[e]) return r[e] = []; if (!(e in r)) { r[e] = null; const n = o[e] && o[e].parent, i = n && t(n); i && (r[e] = [n].concat(i)); } return r[e] })), r }(t); for (const r in o) { const i = o[r]; i && (e(r, c(t, r, i)), n.push(r)); } return n } const a = /^[a-z0-9]+(-[a-z0-9]+)*$/, u = (t, e, n, o = "") => { const r = t.split(":"); if ("@" === t.slice(0, 1)) { if (r.length < 2 || r.length > 3) return null; o = r.shift().slice(1); } if (r.length > 3 || !r.length) return null; if (r.length > 1) { const t = r.pop(), n = r.pop(), i = { provider: r.length > 0 ? r[0] : o, prefix: n, name: t }; return e && !f(i) ? null : i } const i = r[0], c = i.split("-"); if (c.length > 1) { const t = { provider: o, prefix: c.shift(), name: c.join("-") }; return e && !f(t) ? null : t } if (n && "" === o) { const t = { provider: o, prefix: "", name: i }; return e && !f(t, n) ? null : t } return null }, f = (t, e) => !!t && !("" !== t.provider && !t.provider.match(a) || !(e && "" === t.prefix || t.prefix.match(a)) || !t.name.match(a)), l = { provider: "", aliases: {}, not_found: {}, ...e }; function d(t, e) { for (const n in e) if (n in t && typeof t[n] != typeof e[n]) return !1; return !0 } function p(t) { if ("object" != typeof t || null === t) return null; const e = t; if ("string" != typeof e.prefix || !t.icons || "object" != typeof t.icons) return null; if (!d(t, l)) return null; const n = e.icons; for (const t in n) { const e = n[t]; if (!t.match(a) || "string" != typeof e.body || !d(e, r)) return null } const o = e.aliases || Object.create(null); for (const t in o) { const e = o[t], i = e.parent; if (!t.match(a) || "string" != typeof i || !n[i] && !o[i] || !d(e, r)) return null } return e } const h = Object.create(null); function g(t, e) { const n = h[t] || (h[t] = Object.create(null)); return n[e] || (n[e] = function (t, e) { return { provider: t, prefix: e, icons: Object.create(null), missing: new Set } }(t, e)) } function m(t, e) { return p(e) ? s(e, ((e, n) => { n ? t.icons[e] = n : t.missing.add(e); })) : [] } function y(t, e) { let n = []; return ("string" == typeof t ? [t] : Object.keys(h)).forEach((t => { ("string" == typeof t && "string" == typeof e ? [e] : Object.keys(h[t] || {})).forEach((e => { const o = g(t, e); n = n.concat(Object.keys(o.icons).map((n => ("" !== t ? "@" + t + ":" : "") + e + ":" + n))); })); })), n } let b = !1; function v(t) { const e = "string" == typeof t ? u(t, !0, b) : t; if (e) { const t = g(e.provider, e.prefix), n = e.name; return t.icons[n] || (t.missing.has(n) ? null : void 0) } } function x(t, e) { const n = u(t, !0, b); if (!n) return !1; return function (t, e, n) { try { if ("string" == typeof n.body) return t.icons[e] = { ...n }, !0 } catch (t) { } return !1 }(g(n.provider, n.prefix), n.name, e) } function w(t, e) { if ("object" != typeof t) return !1; if ("string" != typeof e && (e = t.provider || ""), b) ; const n = t.prefix; if (!f({ provider: e, prefix: n, name: "a" })) return !1; return !!m(g(e, n), t) } function S(t) { return !!v(t) } function j(t) { const e = v(t); return e ? { ...o, ...e } : null } const E = Object.freeze({ width: null, height: null }), I = Object.freeze({ ...E, ...n }), O = /(-?[0-9.]*[0-9]+[0-9.]*)/g, k = /^-?[0-9.]*[0-9]+[0-9.]*$/g; function C(t, e, n) { if (1 === e) return t; if (n = n || 100, "number" == typeof t) return Math.ceil(t * e * n) / n; if ("string" != typeof t) return t; const o = t.split(O); if (null === o || !o.length) return t; const r = []; let i = o.shift(), c = k.test(i); for (; ;) { if (c) { const t = parseFloat(i); isNaN(t) ? r.push(i) : r.push(Math.ceil(t * e * n) / n); } else r.push(i); if (i = o.shift(), void 0 === i) return r.join(""); c = !c; } } const M = t => "unset" === t || "undefined" === t || "none" === t; function T(t, e) { const n = { ...o, ...t }, r = { ...I, ...e }, i = { left: n.left, top: n.top, width: n.width, height: n.height }; let c = n.body;[n, r].forEach((t => { const e = [], n = t.hFlip, o = t.vFlip; let r, s = t.rotate; switch (n ? o ? s += 2 : (e.push("translate(" + (i.width + i.left).toString() + " " + (0 - i.top).toString() + ")"), e.push("scale(-1 1)"), i.top = i.left = 0) : o && (e.push("translate(" + (0 - i.left).toString() + " " + (i.height + i.top).toString() + ")"), e.push("scale(1 -1)"), i.top = i.left = 0), s < 0 && (s -= 4 * Math.floor(s / 4)), s %= 4, s) { case 1: r = i.height / 2 + i.top, e.unshift("rotate(90 " + r.toString() + " " + r.toString() + ")"); break; case 2: e.unshift("rotate(180 " + (i.width / 2 + i.left).toString() + " " + (i.height / 2 + i.top).toString() + ")"); break; case 3: r = i.width / 2 + i.left, e.unshift("rotate(-90 " + r.toString() + " " + r.toString() + ")"); }s % 2 == 1 && (i.left !== i.top && (r = i.left, i.left = i.top, i.top = r), i.width !== i.height && (r = i.width, i.width = i.height, i.height = r)), e.length && (c = '<g transform="' + e.join(" ") + '">' + c + "</g>"); })); const s = r.width, a = r.height, u = i.width, f = i.height; let l, d; null === s ? (d = null === a ? "1em" : "auto" === a ? f : a, l = C(d, u / f)) : (l = "auto" === s ? u : s, d = null === a ? C(l, f / u) : "auto" === a ? f : a); const p = {}, h = (t, e) => { M(e) || (p[t] = e.toString()); }; return h("width", l), h("height", d), p.viewBox = i.left.toString() + " " + i.top.toString() + " " + u.toString() + " " + f.toString(), { attributes: p, body: c } } const L = /\sid="(\S+)"/g, A = "IconifyId" + Date.now().toString(16) + (16777216 * Math.random() | 0).toString(16); let F = 0; function P(t, e = A) { const n = []; let o; for (; o = L.exec(t);)n.push(o[1]); if (!n.length) return t; const r = "suffix" + (16777216 * Math.random() | Date.now()).toString(16); return n.forEach((n => { const o = "function" == typeof e ? e(n) : e + (F++).toString(), i = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); t = t.replace(new RegExp('([#;"])(' + i + ')([")]|\\.[a-z])', "g"), "$1" + o + r + "$3"); })), t = t.replace(new RegExp(r, "g"), "") } const N = { local: !0, session: !0 }, z = { local: new Set, session: new Set }; let _ = !1; const D = "iconify2", R = "iconify", $ = R + "-count", q = R + "-version", H = 36e5, U = 168; function V(t, e) { try { return t.getItem(e) } catch (t) { } } function Q(t, e, n) { try { return t.setItem(e, n), !0 } catch (t) { } } function G(t, e) { try { t.removeItem(e); } catch (t) { } } function J(t, e) { return Q(t, $, e.toString()) } function B(t) { return parseInt(V(t, $)) || 0 } let K = "undefined" == typeof window ? {} : window; function W(t) { const e = t + "Storage"; try { if (K && K[e] && "number" == typeof K[e].length) return K[e] } catch (t) { } N[t] = !1; } function X(t, e) { const n = W(t); if (!n) return; const o = V(n, q); if (o !== D) { if (o) { const t = B(n); for (let e = 0; e < t; e++)G(n, R + e.toString()); } return Q(n, q, D), void J(n, 0) } const r = Math.floor(Date.now() / H) - U, i = t => { const o = R + t.toString(), i = V(n, o); if ("string" == typeof i) { try { const n = JSON.parse(i); if ("object" == typeof n && "number" == typeof n.cached && n.cached > r && "string" == typeof n.provider && "object" == typeof n.data && "string" == typeof n.data.prefix && e(n, t)) return !0 } catch (t) { } G(n, o); } }; let c = B(n); for (let e = c - 1; e >= 0; e--)i(e) || (e === c - 1 ? (c--, J(n, c)) : z[t].add(e)); } function Y() { if (!_) { _ = !0; for (const t in N) X(t, (t => { const e = t.data, n = g(t.provider, e.prefix); if (!m(n, e).length) return !1; const o = e.lastModified || -1; return n.lastModifiedCached = n.lastModifiedCached ? Math.min(n.lastModifiedCached, o) : o, !0 })); } } function Z(t, e) { switch (t) { case "local": case "session": N[t] = e; break; case "all": for (const t in N) N[t] = e; } } const tt = Object.create(null); function et(t, e) { tt[t] = e; } function nt(t) { return tt[t] || tt[""] } function ot(t) { let e; if ("string" == typeof t.resources) e = [t.resources]; else if (e = t.resources, !(e instanceof Array && e.length)) return null; return { resources: e, path: t.path || "/", maxURL: t.maxURL || 500, rotate: t.rotate || 750, timeout: t.timeout || 5e3, random: !0 === t.random, index: t.index || 0, dataAfterTimeout: !1 !== t.dataAfterTimeout } } const rt = Object.create(null), it = ["https://api.simplesvg.com", "https://api.unisvg.com"], ct = []; for (; it.length > 0;)1 === it.length || Math.random() > .5 ? ct.push(it.shift()) : ct.push(it.pop()); function st(t, e) { const n = ot(e); return null !== n && (rt[t] = n, !0) } function at(t) { return rt[t] } rt[""] = ot({ resources: ["https://api.iconify.design"].concat(ct) }); let ut = (() => { let t; try { if (t = fetch, "function" == typeof t) return t } catch (t) { } })(); const ft = { prepare: (t, e, n) => { const o = [], r = function (t, e) { const n = at(t); if (!n) return 0; let o; if (n.maxURL) { let t = 0; n.resources.forEach((e => { const n = e; t = Math.max(t, n.length); })); const r = e + ".json?icons="; o = n.maxURL - t - n.path.length - r.length; } else o = 0; return o }(t, e), i = "icons"; let c = { type: i, provider: t, prefix: e, icons: [] }, s = 0; return n.forEach(((n, a) => { s += n.length + 1, s >= r && a > 0 && (o.push(c), c = { type: i, provider: t, prefix: e, icons: [] }, s = n.length), c.icons.push(n); })), o.push(c), o }, send: (t, e, n) => { if (!ut) return void n("abort", 424); let o = function (t) { if ("string" == typeof t) { const e = at(t); if (e) return e.path } return "/" }(e.provider); switch (e.type) { case "icons": { const t = e.prefix, n = e.icons.join(","); o += t + ".json?" + new URLSearchParams({ icons: n }).toString(); break } case "custom": { const t = e.uri; o += "/" === t.slice(0, 1) ? t.slice(1) : t; break } default: return void n("abort", 400) }let r = 503; ut(t + o).then((t => { const e = t.status; if (200 === e) return r = 501, t.json(); setTimeout((() => { n(function (t) { return 404 === t }(e) ? "abort" : "next", e); })); })).then((t => { "object" == typeof t && null !== t ? setTimeout((() => { n("success", t); })) : setTimeout((() => { 404 === t ? n("abort", t) : n("next", r); })); })).catch((() => { n("next", r); })); } }; function lt(t, e) { t.forEach((t => { const n = t.loaderCallbacks; n && (t.loaderCallbacks = n.filter((t => t.id !== e))); })); } let dt = 0; var pt = { resources: [], index: 0, timeout: 2e3, rotate: 750, random: !1, dataAfterTimeout: !1 }; function ht(t, e, n, o) { const r = t.resources.length, i = t.random ? Math.floor(Math.random() * r) : t.index; let c; if (t.random) { let e = t.resources.slice(0); for (c = []; e.length > 1;) { const t = Math.floor(Math.random() * e.length); c.push(e[t]), e = e.slice(0, t).concat(e.slice(t + 1)); } c = c.concat(e); } else c = t.resources.slice(i).concat(t.resources.slice(0, i)); const s = Date.now(); let a, u = "pending", f = 0, l = null, d = [], p = []; function h() { l && (clearTimeout(l), l = null); } function g() { "pending" === u && (u = "aborted"), h(), d.forEach((t => { "pending" === t.status && (t.status = "aborted"); })), d = []; } function m(t, e) { e && (p = []), "function" == typeof t && p.push(t); } function y() { u = "failed", p.forEach((t => { t(void 0, a); })); } function b() { d.forEach((t => { "pending" === t.status && (t.status = "aborted"); })), d = []; } function v() { if ("pending" !== u) return; h(); const o = c.shift(); if (void 0 === o) return d.length ? void (l = setTimeout((() => { h(), "pending" === u && (b(), y()); }), t.timeout)) : void y(); const r = { status: "pending", resource: o, callback: (e, n) => { !function (e, n, o) { const r = "success" !== n; switch (d = d.filter((t => t !== e)), u) { case "pending": break; case "failed": if (r || !t.dataAfterTimeout) return; break; default: return }if ("abort" === n) return a = o, void y(); if (r) return a = o, void (d.length || (c.length ? v() : y())); if (h(), b(), !t.random) { const n = t.resources.indexOf(e.resource); -1 !== n && n !== t.index && (t.index = n); } u = "completed", p.forEach((t => { t(o); })); }(r, e, n); } }; d.push(r), f++, l = setTimeout(v, t.rotate), n(o, e, r.callback); } return "function" == typeof o && p.push(o), setTimeout(v), function () { return { startTime: s, payload: e, status: u, queriesSent: f, queriesPending: d.length, subscribe: m, abort: g } } } function gt(t) { const e = { ...pt, ...t }; let n = []; function o() { n = n.filter((t => "pending" === t().status)); } const r = { query: function (t, r, i) { const c = ht(e, t, r, ((t, e) => { o(), i && i(t, e); })); return n.push(c), c }, find: function (t) { return n.find((e => t(e))) || null }, setIndex: t => { e.index = t; }, getIndex: () => e.index, cleanup: o }; return r } function mt() { } const yt = Object.create(null); function bt(t, e, n) { let o, r; if ("string" == typeof t) { const e = nt(t); if (!e) return n(void 0, 424), mt; r = e.send; const i = function (t) { if (!yt[t]) { const e = at(t); if (!e) return; const n = { config: e, redundancy: gt(e) }; yt[t] = n; } return yt[t] }(t); i && (o = i.redundancy); } else { const e = ot(t); if (e) { o = gt(e); const n = nt(t.resources ? t.resources[0] : ""); n && (r = n.send); } } return o && r ? o.query(e, r, n)().abort : (n(void 0, 424), mt) } function vt(t, e) { function n(n) { let o; if (!N[n] || !(o = W(n))) return; const r = z[n]; let i; if (r.size) r.delete(i = Array.from(r).shift()); else if (i = B(o), !J(o, i + 1)) return; const c = { cached: Math.floor(Date.now() / H), provider: t.provider, data: e }; return Q(o, R + i.toString(), JSON.stringify(c)) } _ || Y(), e.lastModified && !function (t, e) { const n = t.lastModifiedCached; if (n && n >= e) return n === e; if (t.lastModifiedCached = e, n) for (const n in N) X(n, (n => { const o = n.data; return n.provider !== t.provider || o.prefix !== t.prefix || o.lastModified === e })); return !0 }(t, e.lastModified) || Object.keys(e.icons).length && (e.not_found && delete (e = Object.assign({}, e)).not_found, n("local") || n("session")); } function xt() { } function wt(t) { t.iconsLoaderFlag || (t.iconsLoaderFlag = !0, setTimeout((() => { t.iconsLoaderFlag = !1, function (t) { t.pendingCallbacksFlag || (t.pendingCallbacksFlag = !0, setTimeout((() => { t.pendingCallbacksFlag = !1; const e = t.loaderCallbacks ? t.loaderCallbacks.slice(0) : []; if (!e.length) return; let n = !1; const o = t.provider, r = t.prefix; e.forEach((e => { const i = e.icons, c = i.pending.length; i.pending = i.pending.filter((e => { if (e.prefix !== r) return !0; const c = e.name; if (t.icons[c]) i.loaded.push({ provider: o, prefix: r, name: c }); else { if (!t.missing.has(c)) return n = !0, !0; i.missing.push({ provider: o, prefix: r, name: c }); } return !1 })), i.pending.length !== c && (n || lt([t], e.id), e.callback(i.loaded.slice(0), i.missing.slice(0), i.pending.slice(0), e.abort)); })); }))); }(t); }))); } const St = t => { const e = g(t.provider, t.prefix).pendingIcons; return !(!e || !e.has(t.name)) }, jt = (t, e) => { const o = function (t) { const e = { loaded: [], missing: [], pending: [] }, n = Object.create(null); t.sort(((t, e) => t.provider !== e.provider ? t.provider.localeCompare(e.provider) : t.prefix !== e.prefix ? t.prefix.localeCompare(e.prefix) : t.name.localeCompare(e.name))); let o = { provider: "", prefix: "", name: "" }; return t.forEach((t => { if (o.name === t.name && o.prefix === t.prefix && o.provider === t.provider) return; o = t; const r = t.provider, i = t.prefix, c = t.name, s = n[r] || (n[r] = Object.create(null)), a = s[i] || (s[i] = g(r, i)); let u; u = c in a.icons ? e.loaded : "" === i || a.missing.has(c) ? e.missing : e.pending; const f = { provider: r, prefix: i, name: c }; u.push(f); })), e }(function (t, e = !0, n = !1) { const o = []; return t.forEach((t => { const r = "string" == typeof t ? u(t, e, n) : t; r && o.push(r); })), o }(t, !0, (b))); if (!o.pending.length) { let t = !0; return e && setTimeout((() => { t && e(o.loaded, o.missing, o.pending, xt); })), () => { t = !1; } } const r = Object.create(null), i = []; let c, s; return o.pending.forEach((t => { const { provider: e, prefix: n } = t; if (n === s && e === c) return; c = e, s = n, i.push(g(e, n)); const o = r[e] || (r[e] = Object.create(null)); o[n] || (o[n] = []); })), o.pending.forEach((t => { const { provider: e, prefix: n, name: o } = t, i = g(e, n), c = i.pendingIcons || (i.pendingIcons = new Set); c.has(o) || (c.add(o), r[e][n].push(o)); })), i.forEach((t => { const { provider: e, prefix: n } = t; r[e][n].length && function (t, e) { t.iconsToLoad ? t.iconsToLoad = t.iconsToLoad.concat(e).sort() : t.iconsToLoad = e, t.iconsQueueFlag || (t.iconsQueueFlag = !0, setTimeout((() => { t.iconsQueueFlag = !1; const { provider: e, prefix: n } = t, o = t.iconsToLoad; let r; delete t.iconsToLoad, o && (r = nt(e)) && r.prepare(e, n, o).forEach((n => { bt(e, n, (e => { if ("object" != typeof e) n.icons.forEach((e => { t.missing.add(e); })); else try { const n = m(t, e); if (!n.length) return; const o = t.pendingIcons; o && n.forEach((t => { o.delete(t); })), vt(t, e); } catch (t) { console.error(t); } wt(t); })); })); }))); }(t, r[e][n]); })), e ? function (t, e, n) { const o = dt++, r = lt.bind(null, n, o); if (!e.pending.length) return r; const i = { id: o, icons: e, callback: t, abort: r }; return n.forEach((t => { (t.loaderCallbacks || (t.loaderCallbacks = [])).push(i); })), r }(e, o, i) : xt }, Et = t => new Promise(((e, n) => { const r = "string" == typeof t ? u(t, !0) : t; r ? jt([r || t], (i => { if (i.length && r) { const t = v(r); if (t) return void e({ ...o, ...t }) } n(t); })) : n(t); })); function It(t, e) { const n = { ...t }; for (const t in e) { const o = e[t], r = typeof o; t in E ? (null === o || o && ("string" === r || "number" === r)) && (n[t] = o) : r === typeof n[t] && (n[t] = "rotate" === t ? o % 4 : o); } return n } const Ot = { ...I, inline: !1 }, kt = "iconify", Ct = "iconify-inline", Mt = "iconifyData" + Date.now(); let Tt = []; function Lt(t) { for (let e = 0; e < Tt.length; e++) { const n = Tt[e]; if (("function" == typeof n.node ? n.node() : n.node) === t) return n } } function At(t, e = !1) { let n = Lt(t); return n ? (n.temporary && (n.temporary = e), n) : (n = { node: t, temporary: e }, Tt.push(n), n) } function Ft() { return Tt } let Pt = null; const Nt = { childList: !0, subtree: !0, attributes: !0 }; function zt(t) { if (!t.observer) return; const e = t.observer; e.pendingScan || (e.pendingScan = setTimeout((() => { delete e.pendingScan, Pt && Pt(t); }))); } function _t(t, e) { if (!t.observer) return; const n = t.observer; if (!n.pendingScan) for (let o = 0; o < e.length; o++) { const r = e[o]; if (r.addedNodes && r.addedNodes.length > 0 || "attributes" === r.type && void 0 !== r.target[Mt]) return void (n.paused || zt(t)) } } function Dt(t, e) { t.observer.instance.observe(e, Nt); } function Rt(t) { let e = t.observer; if (e && e.instance) return; const n = "function" == typeof t.node ? t.node() : t.node; n && window && (e || (e = { paused: 0 }, t.observer = e), e.instance = new window.MutationObserver(_t.bind(null, t)), Dt(t, n), e.paused || zt(t)); } function $t() { Ft().forEach(Rt); } function qt(t) { if (!t.observer) return; const e = t.observer; e.pendingScan && (clearTimeout(e.pendingScan), delete e.pendingScan), e.instance && (e.instance.disconnect(), delete e.instance); } function Ht(t) { const e = null !== Pt; Pt !== t && (Pt = t, e && Ft().forEach(qt)), e ? $t() : function (t) { const e = document; e.readyState && "loading" !== e.readyState ? t() : e.addEventListener("DOMContentLoaded", t); }($t); } function Ut(t) { (t ? [t] : Ft()).forEach((t => { if (!t.observer) return void (t.observer = { paused: 1 }); const e = t.observer; if (e.paused++, e.paused > 1 || !e.instance) return; e.instance.disconnect(); })); } function Vt(t) { if (t) { const e = Lt(t); e && Ut(e); } else Ut(); } function Qt(t) { (t ? [t] : Ft()).forEach((t => { if (!t.observer) return void Rt(t); const e = t.observer; if (e.paused && (e.paused--, !e.paused)) { const n = "function" == typeof t.node ? t.node() : t.node; if (!n) return; e.instance ? Dt(t, n) : Rt(t); } })); } function Gt(t) { if (t) { const e = Lt(t); e && Qt(e); } else Qt(); } function Jt(t, e = !1) { const n = At(t, e); return Rt(n), n } function Bt(t) { const e = Lt(t); e && (qt(e), function (t) { Tt = Tt.filter((e => t !== e && t !== ("function" == typeof e.node ? e.node() : e.node))); }(t)); } const Kt = /[\s,]+/; const Wt = ["width", "height"], Xt = ["inline", "hFlip", "vFlip"]; function Yt(t) { const e = t.getAttribute("data-icon"), n = "string" == typeof e && u(e, !0); if (!n) return null; const o = { ...Ot, inline: t.classList && t.classList.contains(Ct) }; Wt.forEach((e => { const n = t.getAttribute("data-" + e); n && (o[e] = n); })); const r = t.getAttribute("data-rotate"); "string" == typeof r && (o.rotate = function (t, e = 0) { const n = t.replace(/^-?[0-9.]*/, ""); function o(t) { for (; t < 0;)t += 4; return t % 4 } if ("" === n) { const e = parseInt(t); return isNaN(e) ? 0 : o(e) } if (n !== t) { let e = 0; switch (n) { case "%": e = 25; break; case "deg": e = 90; }if (e) { let r = parseFloat(t.slice(0, t.length - n.length)); return isNaN(r) ? 0 : (r /= e, r % 1 == 0 ? o(r) : 0) } } return e }(r)); const i = t.getAttribute("data-flip"); "string" == typeof i && function (t, e) { e.split(Kt).forEach((e => { switch (e.trim()) { case "horizontal": t.hFlip = !0; break; case "vertical": t.vFlip = !0; } })); }(o, i), Xt.forEach((e => { const n = "data-" + e, r = function (t, e) { return t === e || "true" === t || "" !== t && "false" !== t && null }(t.getAttribute(n), n); "boolean" == typeof r && (o[e] = r); })); const c = t.getAttribute("data-mode"); return { name: e, icon: n, customisations: o, mode: c } } const Zt = "svg." + kt + ", i." + kt + ", span." + kt + ", i." + Ct + ", span." + Ct; function te(t, e) { let n = -1 === t.indexOf("xlink:") ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"'; for (const t in e) n += " " + t + '="' + e[t] + '"'; return '<svg xmlns="http://www.w3.org/2000/svg"' + n + ">" + t + "</svg>" } let ee; function ne(t) { return void 0 === ee && function () { try { ee = window.trustedTypes.createPolicy("iconify", { createHTML: t => t }); } catch (t) { ee = null; } }(), ee ? ee.createHTML(t) : t } function oe(t) { const e = new Set(["iconify"]); return ["provider", "prefix"].forEach((n => { t[n] && e.add("iconify--" + t[n]); })), e } function re(t, e, n, o) { const r = t.classList; if (o) { const t = o.classList; Array.from(t).forEach((t => { r.add(t); })); } const i = []; return e.forEach((t => { r.contains(t) ? n.has(t) && i.push(t) : (r.add(t), i.push(t)); })), n.forEach((t => { e.has(t) || r.remove(t); })), i } function ie(t, e, n) { const o = t.style; (n || []).forEach((t => { o.removeProperty(t); })); const r = []; for (const t in e) o.getPropertyValue(t) || (r.push(t), o.setProperty(t, e[t])); return r } function ce(t, e, n) { let o; try { o = document.createElement("span"); } catch (e) { return t } const r = e.customisations, i = T(n, r), c = t[Mt], s = te(P(i.body), { "aria-hidden": "true", role: "img", ...i.attributes }); o.innerHTML = ne(s); const a = o.childNodes[0], u = t.attributes; for (let t = 0; t < u.length; t++) { const e = u.item(t), n = e.name; "class" === n || a.hasAttribute(n) || a.setAttribute(n, e.value); } const f = re(a, oe(e.icon), new Set(c && c.addedClasses), t), l = ie(a, r.inline ? { "vertical-align": "-0.125em" } : {}, c && c.addedStyles), d = { ...e, status: "loaded", addedClasses: f, addedStyles: l }; return a[Mt] = d, t.parentNode && t.parentNode.replaceChild(a, t), a } const se = { display: "inline-block" }, ae = { "background-color": "currentColor" }, ue = { "background-color": "transparent" }, fe = { image: "var(--svg)", repeat: "no-repeat", size: "100% 100%" }, le = { "-webkit-mask": ae, mask: ae, background: ue }; for (const t in le) { const e = le[t]; for (const n in fe) e[t + "-" + n] = fe[n]; } function de(t) { return t + (t.match(/^[-0-9.]+$/) ? "px" : "") } let pe = !1; function he() { pe || (pe = !0, setTimeout((() => { pe && (pe = !1, ge()); }))); } function ge(t, e = !1) { const n = Object.create(null); function r(t, e) { const { provider: o, prefix: r, name: i } = t, c = g(o, r), s = c.icons[i]; if (s) return { status: "loaded", icon: s }; if (c.missing.has(i)) return { status: "missing" }; if (e && !St(t)) { const t = n[o] || (n[o] = Object.create(null)); (t[r] || (t[r] = new Set)).add(i); } return { status: "loading" } } (t ? [t] : Ft()).forEach((t => { const n = "function" == typeof t.node ? t.node() : t.node; if (!n || !n.querySelectorAll) return; let i = !1, c = !1; function s(e, n, r) { if (c || (c = !0, Ut(t)), "SVG" !== e.tagName.toUpperCase()) { const t = n.mode, i = "mask" === t || "bg" !== t && ("style" === t ? -1 !== r.body.indexOf("currentColor") : null); if ("boolean" == typeof i) return void function (t, e, n, o) { const r = e.customisations, i = T(n, r), c = i.attributes, s = t[Mt], a = te(i.body, { ...c, width: n.width + "", height: n.height + "" }), u = re(t, oe(e.icon), new Set(s && s.addedClasses)), f = { "--svg": 'url("' + (l = a, "data:image/svg+xml," + function (t) { return t.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ") }(l) + '")'), width: de(c.width), height: de(c.height), ...se, ...o ? ae : ue }; var l; r.inline && (f["vertical-align"] = "-0.125em"); const d = ie(t, f, s && s.addedStyles), p = { ...e, status: "loaded", addedClasses: u, addedStyles: d }; t[Mt] = p; }(e, n, { ...o, ...r }, i) } ce(e, n, r); } ((function (t) { const e = []; return t.querySelectorAll(Zt).forEach((t => { const n = t[Mt] || "svg" !== t.tagName.toLowerCase() ? Yt(t) : null; n && e.push({ node: t, props: n }); })), e }))(n).forEach((({ node: t, props: e }) => { const n = t[Mt]; if (!n) { const { status: n, icon: o } = r(e.icon, !0); return o ? void s(t, e, o) : (i = i || "loading" === n, void (t[Mt] = { ...e, status: n })) } let o; if (function (t, e) { if (t.name !== e.name || t.mode !== e.mode) return !0; const n = t.customisations, o = e.customisations; for (const t in Ot) if (n[t] !== o[t]) return !0; return !1 }(n, e)) { if (o = r(e.icon, n.name !== e.name), !o.icon) return i = i || "loading" === o.status, void Object.assign(n, { ...e, status: o.status }) } else { if ("loading" !== n.status) return; if (o = r(e.icon, !1), !o.icon) return void (n.status = o.status) } s(t, e, o.icon); })), t.temporary && !i ? Bt(n) : e && i ? Jt(n, !0) : c && t.observer && Qt(t); })); for (const t in n) { const e = n[t]; for (const n in e) { const o = e[n]; jt(Array.from(o).map((e => ({ provider: t, prefix: n, name: e }))), he); } } } function me(t, e, n = !1) { const o = v(t); if (!o) return null; const r = u(t), i = It(Ot, e || {}), c = ce(document.createElement("span"), { name: t, icon: r, customisations: i }, o); return n ? c.outerHTML : c } function ye() { return "3.1.1" } function be(t, e) { return me(t, e, !1) } function ve(t, e) { return me(t, e, !0) } function xe(t, e) { const n = v(t); if (!n) return null; return T(n, It(Ot, e || {})) } function we(t) { t ? function (t) { const e = Lt(t); e ? ge(e) : ge({ node: t, temporary: !0 }, !0); }(t) : ge(); } if ("undefined" != typeof document && "undefined" != typeof window) { !function () { if (document.documentElement) return At(document.documentElement); Tt.push({ node: () => document.documentElement }); }(); const t = window; if (void 0 !== t.IconifyPreload) { const e = t.IconifyPreload, n = "Invalid IconifyPreload syntax."; "object" == typeof e && null !== e && (e instanceof Array ? e : [e]).forEach((t => { try { ("object" != typeof t || null === t || t instanceof Array || "object" != typeof t.icons || "string" != typeof t.prefix || !w(t)) && console.error(n); } catch (t) { console.error(n); } })); } setTimeout((() => { Ht(ge), ge(); })); } function Se(t, e) { Z(t, !1 !== e); } function je(t) { Z(t, !0); } if (et("", ft), "undefined" != typeof document && "undefined" != typeof window) { Y(); const t = window; if (void 0 !== t.IconifyProviders) { const e = t.IconifyProviders; if ("object" == typeof e && null !== e) for (const t in e) { const n = "IconifyProviders[" + t + "] is invalid."; try { const o = e[t]; if ("object" != typeof o || !o || void 0 === o.resources) continue; st(t, o) || console.error(n); } catch (t) { console.error(n); } } } } const Ee = { getAPIConfig: at, setAPIModule: et, sendAPIQuery: bt, setFetch: function (t) { ut = t; }, getFetch: function () { return ut }, listAPIProviders: function () { return Object.keys(rt) } }, Ie = { _api: Ee, addAPIProvider: st, loadIcons: jt, loadIcon: Et, iconExists: S, getIcon: j, listIcons: y, addIcon: x, addCollection: w, replaceIDs: P, calculateSize: C, buildIcon: T, getVersion: ye, renderSVG: be, renderHTML: ve, renderIcon: xe, scan: we, observe: Jt, stopObserving: Bt, pauseObserver: Vt, resumeObserver: Gt, enableCache: Se, disableCache: je }; return t._api = Ee, t.addAPIProvider = st, t.addCollection = w, t.addIcon = x, t.buildIcon = T, t.calculateSize = C, t.default = Ie, t.disableCache = je, t.enableCache = Se, t.getIcon = j, t.getVersion = ye, t.iconExists = S, t.listIcons = y, t.loadIcon = Et, t.loadIcons = jt, t.observe = Jt, t.pauseObserver = Vt, t.renderHTML = ve, t.renderIcon = xe, t.renderSVG = be, t.replaceIDs = P, t.resumeObserver = Gt, t.scan = we, t.stopObserving = Bt, Object.defineProperty(t, "__esModule", { value: !0 }), t }({}); try { for (var key in exports.__esModule = !0, exports.default = Iconify, Iconify) exports[key] = Iconify[key]; } catch (t) { } try { void 0 === self.Iconify && (self.Iconify = Iconify); } catch (t) { }

    		/**
    		 * Indux Icons Plugin
    		 */

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

    		                // Create icon element if it doesn't exist
    		                let iconEl = el.querySelector('.iconify');
    		                if (!iconEl) {
    		                    iconEl = document.createElement('span');
    		                    iconEl.className = 'iconify';
    		                    el.innerHTML = '';
    		                    el.appendChild(iconEl);
    		                }

    		                // Set icon data
    		                iconEl.setAttribute('data-icon', value);

    		                // Ensure Iconify is loaded
    		                if (!window.Iconify) {
    		                    const script = document.createElement('script');
    		                    script.src = 'https://code.iconify.design/3/3.1.1/iconify.min.js';
    		                    script.onload = () => window.Iconify.scan(iconEl);
    		                    document.head.appendChild(script);
    		                } else {
    		                    window.Iconify.scan(iconEl);
    		                }
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

    /**
     * Indux Localization Plugin
     */

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
                console.error('[Indux Localization] Error loading manifest:', error);
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
                console.error('[Indux Localization] Error setting locale:', error);
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

    /**
     * Indux Persistence Plugin
     */

    function initializePersistPlugin() {

        // Create persistence manager
        const persistenceManager = {
            storage: null,
            initialValues: new Map(), // Store initial values

            init() {
                try {
                    this.storage = localStorage;
                } catch (error) {
                    const tempStorage = new Map();
                    this.storage = {
                        getItem: tempStorage.get.bind(tempStorage),
                        setItem: tempStorage.set.bind(tempStorage),
                        removeItem: tempStorage.delete.bind(tempStorage)
                    };
                }
            },

            hasValue(key) {
                return this.storage.getItem(key) !== null;
            },

            getValue(key) {
                return JSON.parse(this.storage.getItem(key));
            },

            setValue(key, value) {
                this.storage.setItem(key, JSON.stringify(value));
            },

            clearAll() {
                // Get all keys from localStorage
                const keys = Object.keys(localStorage);
                // Remove all keys that start with 'x-persist-'
                keys.forEach(key => {
                    if (key.startsWith('x-persist-')) {
                        localStorage.removeItem(key);
                    }
                });
                // Trigger a custom event to notify components
                window.dispatchEvent(new CustomEvent('persistence-cleared'));
            }
        };

        // Initialize storage
        persistenceManager.init();

        // Add x-persist directive
        Alpine.directive('persist', (el, { value, modifiers, expression }, { evaluate, effect }) => {
            // Handle clear modifier
            if (modifiers.includes('clear')) {
                el.addEventListener('click', () => {
                    persistenceManager.clearAll();
                });
                return;
            }

            const key = value || expression;
            if (!key) {
                return;
            }

            // Create a unique key for this persistence
            const persistKey = `x-persist-${key}`;

            // Store initial value
            const initialValue = evaluate(expression);
            persistenceManager.initialValues.set(persistKey, initialValue);

            // Get initial value from storage
            if (persistenceManager.hasValue(persistKey)) {
                const storedValue = persistenceManager.getValue(persistKey);
                evaluate(`${expression} = ${JSON.stringify(storedValue)}`);
            }

            // Set up reactivity
            effect(() => {
                const currentValue = evaluate(expression);
                persistenceManager.setValue(persistKey, currentValue);
            });

            // Listen for clear events
            window.addEventListener('persistence-cleared', () => {
                const initialValue = persistenceManager.initialValues.get(persistKey);
                if (initialValue !== undefined) {
                    evaluate(`${expression} = ${JSON.stringify(initialValue)}`);
                }
            });
        });

        // Add $persist magic method
        Alpine.magic('persist', (el) => ({
            get(key) {
                return persistenceManager.getValue(`x-persist-${key}`);
            },
            set(key, value) {
                persistenceManager.setValue(`x-persist-${key}`, value);
            },
            has(key) {
                return persistenceManager.hasValue(`x-persist-${key}`);
            },
            clear() {
                persistenceManager.clearAll();
            }
        }));
    }

    // Handle both DOMContentLoaded and alpine:init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.Alpine) initializePersistPlugin();
        });
    }

    document.addEventListener('alpine:init', initializePersistPlugin);

    /**
     * Indux Resizable Plugin
     */

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

    /**
     * Indux Theme Plugin
     */

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

    /**
     * Indux Toast Plugin
     */

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

    /**
     * Indux Tooltip Plugin
     */

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

    /**
     * Indux URL Queries Plugin
     * Handles URL query parameter management with Alpine.js integration
     */

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
            console.debug('[Indux URL Queries] New URL:', url.toString());

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
                                console.debug(`[Indux URL Queries] Setting ${prop} to:`, newValue);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'set');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'add') return (newValue) => {
                                console.debug(`[Indux URL Queries] Adding to ${prop}:`, newValue);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: newValue }, 'add');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'remove') return (value) => {
                                console.debug(`[Indux URL Queries] Removing from ${prop}:`, value);
                                clearTimeout(updateTimeouts.get(prop));
                                const timeout = setTimeout(() => {
                                    updateURL({ [prop]: value }, 'remove');
                                }, DEBOUNCE_DELAY);
                                updateTimeouts.set(prop, timeout);
                            };
                            if (key === 'clear') return () => {
                                console.debug(`[Indux URL Queries] Clearing ${prop}`);
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
            console.debug('[Indux URL Queries] Popstate params:', params);
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

    const marked = self.marked;

    /**
     * Indux Markdown Plugin
     */

    // Initialize plugin when either DOM is ready or Alpine is ready
    function initializeMarkdownPlugin() {
        // Register markdown directive
        Alpine.directive('markdown', (el, { expression }, { effect, evaluateLater }) => {
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
                    const html = marked.parse(pathOrContent);
                    el.innerHTML = html;
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

})();
