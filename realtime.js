//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t, n) => () => {
	if (n) throw n[0];
	try {
		return e && (t = e(e = 0)), t;
	} catch (e) {
		throw n = [e], e;
	}
}, s = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), c = (e, n) => {
	let r = {};
	for (var i in e) t(r, i, {
		get: e[i],
		enumerable: !0
	});
	return n || t(r, Symbol.toStringTag, { value: "Module" }), r;
}, l = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, u = (n, r, o) => (o = n == null ? {} : e(i(n)), l(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), d = (e) => a.call(e, "module.exports") ? e["module.exports"] : l(t({}, "__esModule", { value: !0 }), e);
//#endregion
//#region node_modules/is-node-process/lib/index.mjs
function f() {
	if (typeof navigator < "u" && navigator.product === "ReactNative") return !0;
	if (typeof process < "u") {
		let e = process.type;
		return e === "renderer" || e === "worker" ? !1 : !!(process.versions && process.versions.node);
	}
	return !1;
}
//#endregion
//#region node_modules/@vercel/blob/dist/stream-browser.js
var p = /* @__PURE__ */ u((/* @__PURE__ */ s(((e, t) => {
	t.exports = function(e) {
		return e != null && e.constructor != null && typeof e.constructor.isBuffer == "function" && e.constructor.isBuffer(e);
	};
})))(), 1), m = { toWeb() {
	throw Error("Vercel Blob: Sorry, we cannot get a Readable stream in this environment. If you see this message please open an issue here: https://github.com/vercel/storage/ with details on your environment.");
} }, h = /* @__PURE__ */ s(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, {
		SYMBOL_FOR_REQ_CONTEXT: () => u,
		getContext: () => d
	}), t.exports = c(l);
	var u = Symbol.for("@vercel/request-context");
	function d() {
		return globalThis[u]?.get?.() ?? {};
	}
	0 && (t.exports = {
		SYMBOL_FOR_REQ_CONTEXT: u,
		getContext: d
	});
})), g, _, v = o((() => {
	g = crypto, _ = (e) => e instanceof CryptoKey;
})), y, b = o((() => {
	v(), y = async (e, t) => {
		let n = `SHA-${e.slice(-3)}`;
		return new Uint8Array(await g.subtle.digest(n, t));
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/buffer_utils.js
function x(...e) {
	let t = e.reduce((e, { length: t }) => e + t, 0), n = new Uint8Array(t), r = 0;
	for (let t of e) n.set(t, r), r += t.length;
	return n;
}
function ee(e, t) {
	return x(S.encode(e), new Uint8Array([0]), t);
}
function te(e, t, n) {
	if (t < 0 || t >= oe) throw RangeError(`value must be >= 0 and <= ${oe - 1}. Received ${t}`);
	e.set([
		t >>> 24,
		t >>> 16,
		t >>> 8,
		t & 255
	], n);
}
function ne(e) {
	let t = Math.floor(e / oe), n = e % oe, r = /* @__PURE__ */ new Uint8Array(8);
	return te(r, t, 0), te(r, n, 4), r;
}
function re(e) {
	let t = /* @__PURE__ */ new Uint8Array(4);
	return te(t, e), t;
}
function ie(e) {
	return x(re(e.length), e);
}
async function ae(e, t, n) {
	let r = Math.ceil((t >> 3) / 32), i = new Uint8Array(r * 32);
	for (let t = 0; t < r; t++) {
		let r = new Uint8Array(4 + e.length + n.length);
		r.set(re(t + 1)), r.set(e, 4), r.set(n, 4 + e.length), i.set(await y("sha256", r), t * 32);
	}
	return i.slice(0, t >> 3);
}
var S, C, oe, w = o((() => {
	b(), S = new TextEncoder(), C = new TextDecoder(), oe = 2 ** 32;
})), se, T, ce, E, D = o((() => {
	w(), se = (e) => {
		let t = e;
		typeof t == "string" && (t = S.encode(t));
		let n = 32768, r = [];
		for (let e = 0; e < t.length; e += n) r.push(String.fromCharCode.apply(null, t.subarray(e, e + n)));
		return btoa(r.join(""));
	}, T = (e) => se(e).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"), ce = (e) => {
		let t = atob(e), n = new Uint8Array(t.length);
		for (let e = 0; e < t.length; e++) n[e] = t.charCodeAt(e);
		return n;
	}, E = (e) => {
		let t = e;
		t instanceof Uint8Array && (t = C.decode(t)), t = t.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
		try {
			return ce(t);
		} catch {
			throw TypeError("The input to be decoded is not correctly encoded.");
		}
	};
})), le = /* @__PURE__ */ c({
	JOSEAlgNotAllowed: () => de,
	JOSEError: () => O,
	JOSENotSupported: () => A,
	JWEDecryptionFailed: () => j,
	JWEInvalid: () => M,
	JWKInvalid: () => fe,
	JWKSInvalid: () => pe,
	JWKSMultipleMatchingKeys: () => he,
	JWKSNoMatchingKey: () => me,
	JWKSTimeout: () => ge,
	JWSInvalid: () => N,
	JWSSignatureVerificationFailed: () => _e,
	JWTClaimValidationFailed: () => k,
	JWTExpired: () => ue,
	JWTInvalid: () => P
}), O, k, ue, de, A, j, M, N, P, fe, pe, me, he, ge, _e, F = o((() => {
	O = class extends Error {
		constructor(e, t) {
			super(e, t), this.code = "ERR_JOSE_GENERIC", this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
		}
	}, O.code = "ERR_JOSE_GENERIC", k = class extends O {
		constructor(e, t, n = "unspecified", r = "unspecified") {
			super(e, { cause: {
				claim: n,
				reason: r,
				payload: t
			} }), this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED", this.claim = n, this.reason = r, this.payload = t;
		}
	}, k.code = "ERR_JWT_CLAIM_VALIDATION_FAILED", ue = class extends O {
		constructor(e, t, n = "unspecified", r = "unspecified") {
			super(e, { cause: {
				claim: n,
				reason: r,
				payload: t
			} }), this.code = "ERR_JWT_EXPIRED", this.claim = n, this.reason = r, this.payload = t;
		}
	}, ue.code = "ERR_JWT_EXPIRED", de = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
		}
	}, de.code = "ERR_JOSE_ALG_NOT_ALLOWED", A = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JOSE_NOT_SUPPORTED";
		}
	}, A.code = "ERR_JOSE_NOT_SUPPORTED", j = class extends O {
		constructor(e = "decryption operation failed", t) {
			super(e, t), this.code = "ERR_JWE_DECRYPTION_FAILED";
		}
	}, j.code = "ERR_JWE_DECRYPTION_FAILED", M = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JWE_INVALID";
		}
	}, M.code = "ERR_JWE_INVALID", N = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JWS_INVALID";
		}
	}, N.code = "ERR_JWS_INVALID", P = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JWT_INVALID";
		}
	}, P.code = "ERR_JWT_INVALID", fe = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JWK_INVALID";
		}
	}, fe.code = "ERR_JWK_INVALID", pe = class extends O {
		constructor() {
			super(...arguments), this.code = "ERR_JWKS_INVALID";
		}
	}, pe.code = "ERR_JWKS_INVALID", me = class extends O {
		constructor(e = "no applicable key found in the JSON Web Key Set", t) {
			super(e, t), this.code = "ERR_JWKS_NO_MATCHING_KEY";
		}
	}, me.code = "ERR_JWKS_NO_MATCHING_KEY", he = class extends O {
		constructor(e = "multiple matching keys found in the JSON Web Key Set", t) {
			super(e, t), this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
		}
	}, he.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS", ge = class extends O {
		constructor(e = "request timed out", t) {
			super(e, t), this.code = "ERR_JWKS_TIMEOUT";
		}
	}, ge.code = "ERR_JWKS_TIMEOUT", _e = class extends O {
		constructor(e = "signature verification failed", t) {
			super(e, t), this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
		}
	}, _e.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
})), ve, ye = o((() => {
	v(), ve = g.getRandomValues.bind(g);
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/iv.js
function be(e) {
	switch (e) {
		case "A128GCM":
		case "A128GCMKW":
		case "A192GCM":
		case "A192GCMKW":
		case "A256GCM":
		case "A256GCMKW": return 96;
		case "A128CBC-HS256":
		case "A192CBC-HS384":
		case "A256CBC-HS512": return 128;
		default: throw new A(`Unsupported JWE Algorithm: ${e}`);
	}
}
var xe, Se = o((() => {
	F(), ye(), xe = (e) => ve(new Uint8Array(be(e) >> 3));
})), Ce, we = o((() => {
	F(), Se(), Ce = (e, t) => {
		if (t.length << 3 !== be(e)) throw new M("Invalid Initialization Vector length");
	};
})), Te, Ee = o((() => {
	F(), Te = (e, t) => {
		let n = e.byteLength << 3;
		if (n !== t) throw new M(`Invalid Content Encryption Key length. Expected ${t} bits, got ${n} bits`);
	};
})), De, Oe = o((() => {
	De = (e, t) => {
		if (!(e instanceof Uint8Array)) throw TypeError("First argument must be a buffer");
		if (!(t instanceof Uint8Array)) throw TypeError("Second argument must be a buffer");
		if (e.length !== t.length) throw TypeError("Input buffers must have the same length");
		let n = e.length, r = 0, i = -1;
		for (; ++i < n;) r |= e[i] ^ t[i];
		return r === 0;
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/crypto_key.js
function I(e, t = "algorithm.name") {
	return /* @__PURE__ */ TypeError(`CryptoKey does not support this operation, its ${t} must be ${e}`);
}
function L(e, t) {
	return e.name === t;
}
function ke(e) {
	return parseInt(e.name.slice(4), 10);
}
function Ae(e) {
	switch (e) {
		case "ES256": return "P-256";
		case "ES384": return "P-384";
		case "ES512": return "P-521";
		default: throw Error("unreachable");
	}
}
function je(e, t) {
	if (t.length && !t.some((t) => e.usages.includes(t))) {
		let e = "CryptoKey does not support this operation, its usages must include ";
		if (t.length > 2) {
			let n = t.pop();
			e += `one of ${t.join(", ")}, or ${n}.`;
		} else t.length === 2 ? e += `one of ${t[0]} or ${t[1]}.` : e += `${t[0]}.`;
		throw TypeError(e);
	}
}
function Me(e, t, ...n) {
	switch (t) {
		case "HS256":
		case "HS384":
		case "HS512": {
			if (!L(e.algorithm, "HMAC")) throw I("HMAC");
			let n = parseInt(t.slice(2), 10);
			if (ke(e.algorithm.hash) !== n) throw I(`SHA-${n}`, "algorithm.hash");
			break;
		}
		case "RS256":
		case "RS384":
		case "RS512": {
			if (!L(e.algorithm, "RSASSA-PKCS1-v1_5")) throw I("RSASSA-PKCS1-v1_5");
			let n = parseInt(t.slice(2), 10);
			if (ke(e.algorithm.hash) !== n) throw I(`SHA-${n}`, "algorithm.hash");
			break;
		}
		case "PS256":
		case "PS384":
		case "PS512": {
			if (!L(e.algorithm, "RSA-PSS")) throw I("RSA-PSS");
			let n = parseInt(t.slice(2), 10);
			if (ke(e.algorithm.hash) !== n) throw I(`SHA-${n}`, "algorithm.hash");
			break;
		}
		case "EdDSA":
			if (e.algorithm.name !== "Ed25519" && e.algorithm.name !== "Ed448") throw I("Ed25519 or Ed448");
			break;
		case "Ed25519":
			if (!L(e.algorithm, "Ed25519")) throw I("Ed25519");
			break;
		case "ES256":
		case "ES384":
		case "ES512": {
			if (!L(e.algorithm, "ECDSA")) throw I("ECDSA");
			let n = Ae(t);
			if (e.algorithm.namedCurve !== n) throw I(n, "algorithm.namedCurve");
			break;
		}
		default: throw TypeError("CryptoKey does not support this operation");
	}
	je(e, n);
}
function R(e, t, ...n) {
	switch (t) {
		case "A128GCM":
		case "A192GCM":
		case "A256GCM": {
			if (!L(e.algorithm, "AES-GCM")) throw I("AES-GCM");
			let n = parseInt(t.slice(1, 4), 10);
			if (e.algorithm.length !== n) throw I(n, "algorithm.length");
			break;
		}
		case "A128KW":
		case "A192KW":
		case "A256KW": {
			if (!L(e.algorithm, "AES-KW")) throw I("AES-KW");
			let n = parseInt(t.slice(1, 4), 10);
			if (e.algorithm.length !== n) throw I(n, "algorithm.length");
			break;
		}
		case "ECDH":
			switch (e.algorithm.name) {
				case "ECDH":
				case "X25519":
				case "X448": break;
				default: throw I("ECDH, X25519, or X448");
			}
			break;
		case "PBES2-HS256+A128KW":
		case "PBES2-HS384+A192KW":
		case "PBES2-HS512+A256KW":
			if (!L(e.algorithm, "PBKDF2")) throw I("PBKDF2");
			break;
		case "RSA-OAEP":
		case "RSA-OAEP-256":
		case "RSA-OAEP-384":
		case "RSA-OAEP-512": {
			if (!L(e.algorithm, "RSA-OAEP")) throw I("RSA-OAEP");
			let n = parseInt(t.slice(9), 10) || 1;
			if (ke(e.algorithm.hash) !== n) throw I(`SHA-${n}`, "algorithm.hash");
			break;
		}
		default: throw TypeError("CryptoKey does not support this operation");
	}
	je(e, n);
}
var Ne = o((() => {}));
//#endregion
//#region node_modules/jose/dist/browser/lib/invalid_key_input.js
function Pe(e, t, ...n) {
	if (n = n.filter(Boolean), n.length > 2) {
		let t = n.pop();
		e += `one of type ${n.join(", ")}, or ${t}.`;
	} else n.length === 2 ? e += `one of type ${n[0]} or ${n[1]}.` : e += `of type ${n[0]}.`;
	return t == null ? e += ` Received ${t}` : typeof t == "function" && t.name ? e += ` Received function ${t.name}` : typeof t == "object" && t && t.constructor?.name && (e += ` Received an instance of ${t.constructor.name}`), e;
}
function Fe(e, t, ...n) {
	return Pe(`Key for the ${e} algorithm must be `, t, ...n);
}
var z, B = o((() => {
	z = (e, ...t) => Pe("Key must be ", e, ...t);
})), Ie, V, H = o((() => {
	v(), Ie = (e) => _(e) ? !0 : e?.[Symbol.toStringTag] === "KeyObject", V = ["CryptoKey"];
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/decrypt.js
async function Le(e, t, n, r, i, a) {
	if (!(t instanceof Uint8Array)) throw TypeError(z(t, "Uint8Array"));
	let o = parseInt(e.slice(1, 4), 10), s = await g.subtle.importKey("raw", t.subarray(o >> 3), "AES-CBC", !1, ["decrypt"]), c = await g.subtle.importKey("raw", t.subarray(0, o >> 3), {
		hash: `SHA-${o << 1}`,
		name: "HMAC"
	}, !1, ["sign"]), l = x(a, r, n, ne(a.length << 3)), u = new Uint8Array((await g.subtle.sign("HMAC", c, l)).slice(0, o >> 3)), d;
	try {
		d = De(i, u);
	} catch {}
	if (!d) throw new j();
	let f;
	try {
		f = new Uint8Array(await g.subtle.decrypt({
			iv: r,
			name: "AES-CBC"
		}, s, n));
	} catch {}
	if (!f) throw new j();
	return f;
}
async function Re(e, t, n, r, i, a) {
	let o;
	t instanceof Uint8Array ? o = await g.subtle.importKey("raw", t, "AES-GCM", !1, ["decrypt"]) : (R(t, e, "decrypt"), o = t);
	try {
		return new Uint8Array(await g.subtle.decrypt({
			additionalData: a,
			iv: r,
			name: "AES-GCM",
			tagLength: 128
		}, o, x(n, i)));
	} catch {
		throw new j();
	}
}
var ze, Be = o((() => {
	w(), we(), Ee(), Oe(), F(), v(), Ne(), B(), H(), ze = async (e, t, n, r, i, a) => {
		if (!_(t) && !(t instanceof Uint8Array)) throw TypeError(z(t, ...V, "Uint8Array"));
		if (!r) throw new M("JWE Initialization Vector missing");
		if (!i) throw new M("JWE Authentication Tag missing");
		switch (Ce(e, r), e) {
			case "A128CBC-HS256":
			case "A192CBC-HS384":
			case "A256CBC-HS512": return t instanceof Uint8Array && Te(t, parseInt(e.slice(-3), 10)), Le(e, t, n, r, i, a);
			case "A128GCM":
			case "A192GCM":
			case "A256GCM": return t instanceof Uint8Array && Te(t, parseInt(e.slice(1, 4), 10)), Re(e, t, n, r, i, a);
			default: throw new A("Unsupported JWE Content Encryption Algorithm");
		}
	};
})), Ve, He = o((() => {
	Ve = (...e) => {
		let t = e.filter(Boolean);
		if (t.length === 0 || t.length === 1) return !0;
		let n;
		for (let e of t) {
			let t = Object.keys(e);
			if (!n || n.size === 0) n = new Set(t);
			else for (let e of t) {
				if (n.has(e)) return !1;
				n.add(e);
			}
		}
		return !0;
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/is_object.js
function Ue(e) {
	return typeof e == "object" && !!e;
}
function U(e) {
	if (!Ue(e) || Object.prototype.toString.call(e) !== "[object Object]") return !1;
	if (Object.getPrototypeOf(e) === null) return !0;
	let t = e;
	for (; Object.getPrototypeOf(t) !== null;) t = Object.getPrototypeOf(t);
	return Object.getPrototypeOf(e) === t;
}
var W = o((() => {})), We, Ge = o((() => {
	We = [
		{
			hash: "SHA-256",
			name: "HMAC"
		},
		!0,
		["sign"]
	];
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/aeskw.js
function Ke(e, t) {
	if (e.algorithm.length !== parseInt(t.slice(1, 4), 10)) throw TypeError(`Invalid key size for alg: ${t}`);
}
function qe(e, t, n) {
	if (_(e)) return R(e, t, n), e;
	if (e instanceof Uint8Array) return g.subtle.importKey("raw", e, "AES-KW", !0, [n]);
	throw TypeError(z(e, ...V, "Uint8Array"));
}
var Je, Ye, Xe = o((() => {
	Ge(), v(), Ne(), B(), H(), Je = async (e, t, n) => {
		let r = await qe(t, e, "wrapKey");
		Ke(r, e);
		let i = await g.subtle.importKey("raw", n, ...We);
		return new Uint8Array(await g.subtle.wrapKey("raw", i, r, "AES-KW"));
	}, Ye = async (e, t, n) => {
		let r = await qe(t, e, "unwrapKey");
		Ke(r, e);
		let i = await g.subtle.unwrapKey("raw", n, r, "AES-KW", ...We);
		return new Uint8Array(await g.subtle.exportKey("raw", i));
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/ecdhes.js
async function Ze(e, t, n, r, i = /* @__PURE__ */ new Uint8Array(), a = /* @__PURE__ */ new Uint8Array()) {
	if (!_(e)) throw TypeError(z(e, ...V));
	if (R(e, "ECDH"), !_(t)) throw TypeError(z(t, ...V));
	R(t, "ECDH", "deriveBits");
	let o = x(ie(S.encode(n)), ie(i), ie(a), re(r)), s;
	return s = e.algorithm.name === "X25519" ? 256 : e.algorithm.name === "X448" ? 448 : Math.ceil(parseInt(e.algorithm.namedCurve.substr(-3), 10) / 8) << 3, ae(new Uint8Array(await g.subtle.deriveBits({
		name: e.algorithm.name,
		public: e
	}, t, s)), r, o);
}
async function Qe(e) {
	if (!_(e)) throw TypeError(z(e, ...V));
	return g.subtle.generateKey(e.algorithm, !0, ["deriveBits"]);
}
function $e(e) {
	if (!_(e)) throw TypeError(z(e, ...V));
	return [
		"P-256",
		"P-384",
		"P-521"
	].includes(e.algorithm.namedCurve) || e.algorithm.name === "X25519" || e.algorithm.name === "X448";
}
var et = o((() => {
	w(), v(), Ne(), B(), H();
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/check_p2s.js
function tt(e) {
	if (!(e instanceof Uint8Array) || e.length < 8) throw new M("PBES2 Salt Input must be 8 or more octets");
}
var nt = o((() => {
	F();
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/pbes2kw.js
function rt(e, t) {
	if (e instanceof Uint8Array) return g.subtle.importKey("raw", e, "PBKDF2", !1, ["deriveBits"]);
	if (_(e)) return R(e, t, "deriveBits", "deriveKey"), e;
	throw TypeError(z(e, ...V, "Uint8Array"));
}
async function it(e, t, n, r) {
	tt(e);
	let i = ee(t, e), a = parseInt(t.slice(13, 16), 10), o = {
		hash: `SHA-${t.slice(8, 11)}`,
		iterations: n,
		name: "PBKDF2",
		salt: i
	}, s = {
		length: a,
		name: "AES-KW"
	}, c = await rt(r, t);
	if (c.usages.includes("deriveBits")) return new Uint8Array(await g.subtle.deriveBits(o, c, a));
	if (c.usages.includes("deriveKey")) return g.subtle.deriveKey(o, c, s, !1, ["wrapKey", "unwrapKey"]);
	throw TypeError("PBKDF2 key \"usages\" must include \"deriveBits\" or \"deriveKey\"");
}
var at, ot, st = o((() => {
	ye(), w(), D(), Xe(), nt(), v(), Ne(), B(), H(), at = async (e, t, n, r = 2048, i = ve(/* @__PURE__ */ new Uint8Array(16))) => {
		let a = await it(i, e, r, t);
		return {
			encryptedKey: await Je(e.slice(-6), a, n),
			p2c: r,
			p2s: T(i)
		};
	}, ot = async (e, t, n, r, i) => {
		let a = await it(i, e, r, t);
		return Ye(e.slice(-6), a, n);
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/subtle_rsaes.js
function ct(e) {
	switch (e) {
		case "RSA-OAEP":
		case "RSA-OAEP-256":
		case "RSA-OAEP-384":
		case "RSA-OAEP-512": return "RSA-OAEP";
		default: throw new A(`alg ${e} is not supported either by JOSE or your javascript runtime`);
	}
}
var lt = o((() => {
	F();
})), ut, dt = o((() => {
	ut = (e, t) => {
		if (e.startsWith("RS") || e.startsWith("PS")) {
			let { modulusLength: n } = t.algorithm;
			if (typeof n != "number" || n < 2048) throw TypeError(`${e} requires key modulusLength to be 2048 bits or larger`);
		}
	};
})), ft, pt, mt = o((() => {
	lt(), Ge(), v(), Ne(), dt(), B(), H(), ft = async (e, t, n) => {
		if (!_(t)) throw TypeError(z(t, ...V));
		if (R(t, e, "encrypt", "wrapKey"), ut(e, t), t.usages.includes("encrypt")) return new Uint8Array(await g.subtle.encrypt(ct(e), t, n));
		if (t.usages.includes("wrapKey")) {
			let r = await g.subtle.importKey("raw", n, ...We);
			return new Uint8Array(await g.subtle.wrapKey("raw", r, t, ct(e)));
		}
		throw TypeError("RSA-OAEP key \"usages\" must include \"encrypt\" or \"wrapKey\" for this operation");
	}, pt = async (e, t, n) => {
		if (!_(t)) throw TypeError(z(t, ...V));
		if (R(t, e, "decrypt", "unwrapKey"), ut(e, t), t.usages.includes("decrypt")) return new Uint8Array(await g.subtle.decrypt(ct(e), t, n));
		if (t.usages.includes("unwrapKey")) {
			let r = await g.subtle.unwrapKey("raw", n, t, ct(e), ...We);
			return new Uint8Array(await g.subtle.exportKey("raw", r));
		}
		throw TypeError("RSA-OAEP key \"usages\" must include \"decrypt\" or \"unwrapKey\" for this operation");
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/is_jwk.js
function ht(e) {
	return U(e) && typeof e.kty == "string";
}
function gt(e) {
	return e.kty !== "oct" && typeof e.d == "string";
}
function _t(e) {
	return e.kty !== "oct" && e.d === void 0;
}
function vt(e) {
	return ht(e) && e.kty === "oct" && typeof e.k == "string";
}
var yt = o((() => {
	W();
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/jwk_to_key.js
function bt(e) {
	let t, n;
	switch (e.kty) {
		case "RSA":
			switch (e.alg) {
				case "PS256":
				case "PS384":
				case "PS512":
					t = {
						name: "RSA-PSS",
						hash: `SHA-${e.alg.slice(-3)}`
					}, n = e.d ? ["sign"] : ["verify"];
					break;
				case "RS256":
				case "RS384":
				case "RS512":
					t = {
						name: "RSASSA-PKCS1-v1_5",
						hash: `SHA-${e.alg.slice(-3)}`
					}, n = e.d ? ["sign"] : ["verify"];
					break;
				case "RSA-OAEP":
				case "RSA-OAEP-256":
				case "RSA-OAEP-384":
				case "RSA-OAEP-512":
					t = {
						name: "RSA-OAEP",
						hash: `SHA-${parseInt(e.alg.slice(-3), 10) || 1}`
					}, n = e.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
					break;
				default: throw new A("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		case "EC":
			switch (e.alg) {
				case "ES256":
					t = {
						name: "ECDSA",
						namedCurve: "P-256"
					}, n = e.d ? ["sign"] : ["verify"];
					break;
				case "ES384":
					t = {
						name: "ECDSA",
						namedCurve: "P-384"
					}, n = e.d ? ["sign"] : ["verify"];
					break;
				case "ES512":
					t = {
						name: "ECDSA",
						namedCurve: "P-521"
					}, n = e.d ? ["sign"] : ["verify"];
					break;
				case "ECDH-ES":
				case "ECDH-ES+A128KW":
				case "ECDH-ES+A192KW":
				case "ECDH-ES+A256KW":
					t = {
						name: "ECDH",
						namedCurve: e.crv
					}, n = e.d ? ["deriveBits"] : [];
					break;
				default: throw new A("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		case "OKP":
			switch (e.alg) {
				case "Ed25519":
					t = { name: "Ed25519" }, n = e.d ? ["sign"] : ["verify"];
					break;
				case "EdDSA":
					t = { name: e.crv }, n = e.d ? ["sign"] : ["verify"];
					break;
				case "ECDH-ES":
				case "ECDH-ES+A128KW":
				case "ECDH-ES+A192KW":
				case "ECDH-ES+A256KW":
					t = { name: e.crv }, n = e.d ? ["deriveBits"] : [];
					break;
				default: throw new A("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
			}
			break;
		default: throw new A("Invalid or unsupported JWK \"kty\" (Key Type) Parameter value");
	}
	return {
		algorithm: t,
		keyUsages: n
	};
}
var xt, St = o((() => {
	v(), F(), xt = async (e) => {
		if (!e.alg) throw TypeError("\"alg\" argument is required when \"jwk.alg\" is not present");
		let { algorithm: t, keyUsages: n } = bt(e), r = [
			t,
			e.ext ?? !1,
			e.key_ops ?? n
		], i = { ...e };
		return delete i.alg, delete i.use, g.subtle.importKey("jwk", i, ...r);
	};
})), Ct, wt, Tt, Et, Dt, Ot, kt, At, jt = o((() => {
	yt(), D(), St(), Ct = (e) => E(e), Et = (e) => e?.[Symbol.toStringTag] === "KeyObject", Dt = async (e, t, n, r, i = !1) => {
		let a = e.get(t);
		if (a?.[r]) return a[r];
		let o = await xt({
			...n,
			alg: r
		});
		return i && Object.freeze(t), a ? a[r] = o : e.set(t, { [r]: o }), o;
	}, Ot = (e, t) => {
		if (Et(e)) {
			let n = e.export({ format: "jwk" });
			return delete n.d, delete n.dp, delete n.dq, delete n.p, delete n.q, delete n.qi, n.k ? Ct(n.k) : (Tt ||= /* @__PURE__ */ new WeakMap(), Dt(Tt, e, n, t));
		}
		return ht(e) ? e.k ? E(e.k) : (Tt ||= /* @__PURE__ */ new WeakMap(), Dt(Tt, e, e, t, !0)) : e;
	}, kt = (e, t) => {
		if (Et(e)) {
			let n = e.export({ format: "jwk" });
			return n.k ? Ct(n.k) : (wt ||= /* @__PURE__ */ new WeakMap(), Dt(wt, e, n, t));
		}
		return ht(e) ? e.k ? E(e.k) : (wt ||= /* @__PURE__ */ new WeakMap(), Dt(wt, e, e, t, !0)) : e;
	}, At = {
		normalizePublicKey: Ot,
		normalizePrivateKey: kt
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/cek.js
function Mt(e) {
	switch (e) {
		case "A128GCM": return 128;
		case "A192GCM": return 192;
		case "A256GCM":
		case "A128CBC-HS256": return 256;
		case "A192CBC-HS384": return 384;
		case "A256CBC-HS512": return 512;
		default: throw new A(`Unsupported JWE Algorithm: ${e}`);
	}
}
var G, Nt = o((() => {
	F(), ye(), G = (e) => ve(new Uint8Array(Mt(e) >> 3));
})), Pt, Ft = o((() => {
	Pt = (e, t) => `-----BEGIN ${t}-----\n${(e.match(/.{1,64}/g) || []).join("\n")}\n-----END ${t}-----`;
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/asn1.js
function It(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let r = Lt(e.subarray(n));
		t.push(r), n += r.byteLength;
	}
	return t;
}
function Lt(e) {
	let t = 0, n = e[0] & 31;
	if (t++, n === 31) {
		for (n = 0; e[t] >= 128;) n = n * 128 + e[t] - 128, t++;
		n = n * 128 + e[t] - 128, t++;
	}
	let r = 0;
	if (e[t] < 128) r = e[t], t++;
	else if (r === 128) {
		for (r = 0; e[t + r] !== 0 || e[t + r + 1] !== 0;) {
			if (r > e.byteLength) throw TypeError("invalid indefinite form length");
			r++;
		}
		let n = t + r + 2;
		return {
			byteLength: n,
			contents: e.subarray(t, t + r),
			raw: e.subarray(0, n)
		};
	} else {
		let n = e[t] & 127;
		t++, r = 0;
		for (let i = 0; i < n; i++) r = r * 256 + e[t], t++;
	}
	let i = t + r;
	return {
		byteLength: i,
		contents: e.subarray(t, i),
		raw: e.subarray(0, i)
	};
}
function Rt(e) {
	let t = It(It(Lt(e).contents)[0].contents);
	return se(t[t[0].raw[0] === 160 ? 6 : 5].raw);
}
function zt(e) {
	let t = e.replace(/(?:-----(?:BEGIN|END) CERTIFICATE-----|\s)/g, ""), n = ce(t);
	return Pt(Rt(n), "PUBLIC KEY");
}
var Bt, Vt, Ht, K, Ut, Wt, Gt, Kt, qt, Jt = o((() => {
	v(), B(), D(), Ft(), F(), H(), Bt = async (e, t, n) => {
		if (!_(n)) throw TypeError(z(n, ...V));
		if (!n.extractable) throw TypeError("CryptoKey is not extractable");
		if (n.type !== e) throw TypeError(`key is not a ${e} key`);
		return Pt(se(new Uint8Array(await g.subtle.exportKey(t, n))), `${e.toUpperCase()} KEY`);
	}, Vt = (e) => Bt("public", "spki", e), Ht = (e) => Bt("private", "pkcs8", e), K = (e, t, n = 0) => {
		n === 0 && (t.unshift(t.length), t.unshift(6));
		let r = e.indexOf(t[0], n);
		if (r === -1) return !1;
		let i = e.subarray(r, r + t.length);
		return i.length === t.length ? i.every((e, n) => e === t[n]) || K(e, t, r + 1) : !1;
	}, Ut = (e) => {
		switch (!0) {
			case K(e, [
				42,
				134,
				72,
				206,
				61,
				3,
				1,
				7
			]): return "P-256";
			case K(e, [
				43,
				129,
				4,
				0,
				34
			]): return "P-384";
			case K(e, [
				43,
				129,
				4,
				0,
				35
			]): return "P-521";
			case K(e, [
				43,
				101,
				110
			]): return "X25519";
			case K(e, [
				43,
				101,
				111
			]): return "X448";
			case K(e, [
				43,
				101,
				112
			]): return "Ed25519";
			case K(e, [
				43,
				101,
				113
			]): return "Ed448";
			default: throw new A("Invalid or unsupported EC Key Curve or OKP Key Sub Type");
		}
	}, Wt = async (e, t, n, r, i) => {
		let a, o, s = new Uint8Array(atob(n.replace(e, "")).split("").map((e) => e.charCodeAt(0))), c = t === "spki";
		switch (r) {
			case "PS256":
			case "PS384":
			case "PS512":
				a = {
					name: "RSA-PSS",
					hash: `SHA-${r.slice(-3)}`
				}, o = c ? ["verify"] : ["sign"];
				break;
			case "RS256":
			case "RS384":
			case "RS512":
				a = {
					name: "RSASSA-PKCS1-v1_5",
					hash: `SHA-${r.slice(-3)}`
				}, o = c ? ["verify"] : ["sign"];
				break;
			case "RSA-OAEP":
			case "RSA-OAEP-256":
			case "RSA-OAEP-384":
			case "RSA-OAEP-512":
				a = {
					name: "RSA-OAEP",
					hash: `SHA-${parseInt(r.slice(-3), 10) || 1}`
				}, o = c ? ["encrypt", "wrapKey"] : ["decrypt", "unwrapKey"];
				break;
			case "ES256":
				a = {
					name: "ECDSA",
					namedCurve: "P-256"
				}, o = c ? ["verify"] : ["sign"];
				break;
			case "ES384":
				a = {
					name: "ECDSA",
					namedCurve: "P-384"
				}, o = c ? ["verify"] : ["sign"];
				break;
			case "ES512":
				a = {
					name: "ECDSA",
					namedCurve: "P-521"
				}, o = c ? ["verify"] : ["sign"];
				break;
			case "ECDH-ES":
			case "ECDH-ES+A128KW":
			case "ECDH-ES+A192KW":
			case "ECDH-ES+A256KW": {
				let e = Ut(s);
				a = e.startsWith("P-") ? {
					name: "ECDH",
					namedCurve: e
				} : { name: e }, o = c ? [] : ["deriveBits"];
				break;
			}
			case "Ed25519":
				a = { name: "Ed25519" }, o = c ? ["verify"] : ["sign"];
				break;
			case "EdDSA":
				a = { name: Ut(s) }, o = c ? ["verify"] : ["sign"];
				break;
			default: throw new A("Invalid or unsupported \"alg\" (Algorithm) value");
		}
		return g.subtle.importKey(t, s, a, i?.extractable ?? !1, o);
	}, Gt = (e, t, n) => Wt(/(?:-----(?:BEGIN|END) PRIVATE KEY-----|\s)/g, "pkcs8", e, t, n), Kt = (e, t, n) => Wt(/(?:-----(?:BEGIN|END) PUBLIC KEY-----|\s)/g, "spki", e, t, n), qt = (e, t, n) => {
		let r;
		try {
			r = zt(e);
		} catch (e) {
			throw TypeError("Failed to parse the X.509 certificate", { cause: e });
		}
		return Kt(r, t, n);
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/key/import.js
async function Yt(e, t, n) {
	if (typeof e != "string" || e.indexOf("-----BEGIN PUBLIC KEY-----") !== 0) throw TypeError("\"spki\" must be SPKI formatted string");
	return Kt(e, t, n);
}
async function Xt(e, t, n) {
	if (typeof e != "string" || e.indexOf("-----BEGIN CERTIFICATE-----") !== 0) throw TypeError("\"x509\" must be X.509 formatted string");
	return qt(e, t, n);
}
async function Zt(e, t, n) {
	if (typeof e != "string" || e.indexOf("-----BEGIN PRIVATE KEY-----") !== 0) throw TypeError("\"pkcs8\" must be PKCS#8 formatted string");
	return Gt(e, t, n);
}
async function Qt(e, t) {
	if (!U(e)) throw TypeError("JWK must be an object");
	switch (t ||= e.alg, e.kty) {
		case "oct":
			if (typeof e.k != "string" || !e.k) throw TypeError("missing \"k\" (Key Value) Parameter value");
			return E(e.k);
		case "RSA": if ("oth" in e && e.oth !== void 0) throw new A("RSA JWK \"oth\" (Other Primes Info) Parameter value is not supported");
		case "EC":
		case "OKP": return xt({
			...e,
			alg: t
		});
		default: throw new A("Unsupported \"kty\" (Key Type) Parameter value");
	}
}
var $t = o((() => {
	D(), Jt(), St(), F(), W();
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/check_key_type.js
function en(e, t, n, r) {
	t.startsWith("HS") || t === "dir" || t.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(t) ? nn(t, n, r, e) : rn(t, n, r, e);
}
var q, tn, nn, rn, an, on, sn = o((() => {
	B(), H(), yt(), q = (e) => e?.[Symbol.toStringTag], tn = (e, t, n) => {
		if (t.use !== void 0 && t.use !== "sig") throw TypeError("Invalid key for this operation, when present its use must be sig");
		if (t.key_ops !== void 0 && t.key_ops.includes?.(n) !== !0) throw TypeError(`Invalid key for this operation, when present its key_ops must include ${n}`);
		if (t.alg !== void 0 && t.alg !== e) throw TypeError(`Invalid key for this operation, when present its alg must be ${e}`);
		return !0;
	}, nn = (e, t, n, r) => {
		if (!(t instanceof Uint8Array)) {
			if (r && ht(t)) {
				if (vt(t) && tn(e, t, n)) return;
				throw TypeError("JSON Web Key for symmetric algorithms must have JWK \"kty\" (Key Type) equal to \"oct\" and the JWK \"k\" (Key Value) present");
			}
			if (!Ie(t)) throw TypeError(Fe(e, t, ...V, "Uint8Array", r ? "JSON Web Key" : null));
			if (t.type !== "secret") throw TypeError(`${q(t)} instances for symmetric algorithms must be of type "secret"`);
		}
	}, rn = (e, t, n, r) => {
		if (r && ht(t)) switch (n) {
			case "sign":
				if (gt(t) && tn(e, t, n)) return;
				throw TypeError("JSON Web Key for this operation be a private JWK");
			case "verify":
				if (_t(t) && tn(e, t, n)) return;
				throw TypeError("JSON Web Key for this operation be a public JWK");
		}
		if (!Ie(t)) throw TypeError(Fe(e, t, ...V, r ? "JSON Web Key" : null));
		if (t.type === "secret") throw TypeError(`${q(t)} instances for asymmetric algorithms must not be of type "secret"`);
		if (n === "sign" && t.type === "public") throw TypeError(`${q(t)} instances for asymmetric algorithm signing must be of type "private"`);
		if (n === "decrypt" && t.type === "public") throw TypeError(`${q(t)} instances for asymmetric algorithm decryption must be of type "private"`);
		if (t.algorithm && n === "verify" && t.type === "private") throw TypeError(`${q(t)} instances for asymmetric algorithm verifying must be of type "public"`);
		if (t.algorithm && n === "encrypt" && t.type === "private") throw TypeError(`${q(t)} instances for asymmetric algorithm encryption must be of type "public"`);
	}, an = en.bind(void 0, !1), on = en.bind(void 0, !0);
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/encrypt.js
async function cn(e, t, n, r, i) {
	if (!(n instanceof Uint8Array)) throw TypeError(z(n, "Uint8Array"));
	let a = parseInt(e.slice(1, 4), 10), o = await g.subtle.importKey("raw", n.subarray(a >> 3), "AES-CBC", !1, ["encrypt"]), s = await g.subtle.importKey("raw", n.subarray(0, a >> 3), {
		hash: `SHA-${a << 1}`,
		name: "HMAC"
	}, !1, ["sign"]), c = new Uint8Array(await g.subtle.encrypt({
		iv: r,
		name: "AES-CBC"
	}, o, t)), l = x(i, r, c, ne(i.length << 3));
	return {
		ciphertext: c,
		tag: new Uint8Array((await g.subtle.sign("HMAC", s, l)).slice(0, a >> 3)),
		iv: r
	};
}
async function ln(e, t, n, r, i) {
	let a;
	n instanceof Uint8Array ? a = await g.subtle.importKey("raw", n, "AES-GCM", !1, ["encrypt"]) : (R(n, e, "encrypt"), a = n);
	let o = new Uint8Array(await g.subtle.encrypt({
		additionalData: i,
		iv: r,
		name: "AES-GCM",
		tagLength: 128
	}, a, t)), s = o.slice(-16);
	return {
		ciphertext: o.slice(0, -16),
		tag: s,
		iv: r
	};
}
var un, dn = o((() => {
	w(), we(), Ee(), v(), Ne(), B(), Se(), F(), H(), un = async (e, t, n, r, i) => {
		if (!_(n) && !(n instanceof Uint8Array)) throw TypeError(z(n, ...V, "Uint8Array"));
		switch (r ? Ce(e, r) : r = xe(e), e) {
			case "A128CBC-HS256":
			case "A192CBC-HS384":
			case "A256CBC-HS512": return n instanceof Uint8Array && Te(n, parseInt(e.slice(-3), 10)), cn(e, t, n, r, i);
			case "A128GCM":
			case "A192GCM":
			case "A256GCM": return n instanceof Uint8Array && Te(n, parseInt(e.slice(1, 4), 10)), ln(e, t, n, r, i);
			default: throw new A("Unsupported JWE Content Encryption Algorithm");
		}
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/aesgcmkw.js
async function fn(e, t, n, r) {
	let i = e.slice(0, 7), a = await un(i, n, t, r, /* @__PURE__ */ new Uint8Array());
	return {
		encryptedKey: a.ciphertext,
		iv: T(a.iv),
		tag: T(a.tag)
	};
}
async function pn(e, t, n, r, i) {
	let a = e.slice(0, 7);
	return ze(a, t, n, r, i, /* @__PURE__ */ new Uint8Array());
}
var mn = o((() => {
	dn(), Be(), D();
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/decrypt_key_management.js
async function hn(e, t, n, r, i) {
	switch (an(e, t, "decrypt"), t = await At.normalizePrivateKey?.(t, e) || t, e) {
		case "dir":
			if (n !== void 0) throw new M("Encountered unexpected JWE Encrypted Key");
			return t;
		case "ECDH-ES": if (n !== void 0) throw new M("Encountered unexpected JWE Encrypted Key");
		case "ECDH-ES+A128KW":
		case "ECDH-ES+A192KW":
		case "ECDH-ES+A256KW": {
			if (!U(r.epk)) throw new M("JOSE Header \"epk\" (Ephemeral Public Key) missing or invalid");
			if (!$e(t)) throw new A("ECDH with the provided key is not allowed or not supported by your javascript runtime");
			let i = await Qt(r.epk, e), a, o;
			if (r.apu !== void 0) {
				if (typeof r.apu != "string") throw new M("JOSE Header \"apu\" (Agreement PartyUInfo) invalid");
				try {
					a = E(r.apu);
				} catch {
					throw new M("Failed to base64url decode the apu");
				}
			}
			if (r.apv !== void 0) {
				if (typeof r.apv != "string") throw new M("JOSE Header \"apv\" (Agreement PartyVInfo) invalid");
				try {
					o = E(r.apv);
				} catch {
					throw new M("Failed to base64url decode the apv");
				}
			}
			let s = await Ze(i, t, e === "ECDH-ES" ? r.enc : e, e === "ECDH-ES" ? Mt(r.enc) : parseInt(e.slice(-5, -2), 10), a, o);
			if (e === "ECDH-ES") return s;
			if (n === void 0) throw new M("JWE Encrypted Key missing");
			return Ye(e.slice(-6), s, n);
		}
		case "RSA1_5":
		case "RSA-OAEP":
		case "RSA-OAEP-256":
		case "RSA-OAEP-384":
		case "RSA-OAEP-512":
			if (n === void 0) throw new M("JWE Encrypted Key missing");
			return pt(e, t, n);
		case "PBES2-HS256+A128KW":
		case "PBES2-HS384+A192KW":
		case "PBES2-HS512+A256KW": {
			if (n === void 0) throw new M("JWE Encrypted Key missing");
			if (typeof r.p2c != "number") throw new M("JOSE Header \"p2c\" (PBES2 Count) missing or invalid");
			let a = i?.maxPBES2Count || 1e4;
			if (r.p2c > a) throw new M("JOSE Header \"p2c\" (PBES2 Count) out is of acceptable bounds");
			if (typeof r.p2s != "string") throw new M("JOSE Header \"p2s\" (PBES2 Salt) missing or invalid");
			let o;
			try {
				o = E(r.p2s);
			} catch {
				throw new M("Failed to base64url decode the p2s");
			}
			return ot(e, t, n, r.p2c, o);
		}
		case "A128KW":
		case "A192KW":
		case "A256KW":
			if (n === void 0) throw new M("JWE Encrypted Key missing");
			return Ye(e, t, n);
		case "A128GCMKW":
		case "A192GCMKW":
		case "A256GCMKW": {
			if (n === void 0) throw new M("JWE Encrypted Key missing");
			if (typeof r.iv != "string") throw new M("JOSE Header \"iv\" (Initialization Vector) missing or invalid");
			if (typeof r.tag != "string") throw new M("JOSE Header \"tag\" (Authentication Tag) missing or invalid");
			let i;
			try {
				i = E(r.iv);
			} catch {
				throw new M("Failed to base64url decode the iv");
			}
			let a;
			try {
				a = E(r.tag);
			} catch {
				throw new M("Failed to base64url decode the tag");
			}
			return pn(e, t, n, i, a);
		}
		default: throw new A("Invalid or unsupported \"alg\" (JWE Algorithm) header value");
	}
}
var gn = o((() => {
	Xe(), et(), st(), mt(), D(), jt(), F(), Nt(), $t(), sn(), W(), mn();
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/validate_crit.js
function _n(e, t, n, r, i) {
	if (i.crit !== void 0 && r?.crit === void 0) throw new e("\"crit\" (Critical) Header Parameter MUST be integrity protected");
	if (!r || r.crit === void 0) return /* @__PURE__ */ new Set();
	if (!Array.isArray(r.crit) || r.crit.length === 0 || r.crit.some((e) => typeof e != "string" || e.length === 0)) throw new e("\"crit\" (Critical) Header Parameter MUST be an array of non-empty strings when present");
	let a;
	a = n === void 0 ? t : new Map([...Object.entries(n), ...t.entries()]);
	for (let t of r.crit) {
		if (!a.has(t)) throw new A(`Extension Header Parameter "${t}" is not recognized`);
		if (i[t] === void 0) throw new e(`Extension Header Parameter "${t}" is missing`);
		if (a.get(t) && r[t] === void 0) throw new e(`Extension Header Parameter "${t}" MUST be integrity protected`);
	}
	return new Set(r.crit);
}
var vn = o((() => {
	F();
})), yn, bn = o((() => {
	yn = (e, t) => {
		if (t !== void 0 && (!Array.isArray(t) || t.some((e) => typeof e != "string"))) throw TypeError(`"${e}" option must be an array of strings`);
		if (t) return new Set(t);
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jwe/flattened/decrypt.js
async function xn(e, t, n) {
	if (!U(e)) throw new M("Flattened JWE must be an object");
	if (e.protected === void 0 && e.header === void 0 && e.unprotected === void 0) throw new M("JOSE Header missing");
	if (e.iv !== void 0 && typeof e.iv != "string") throw new M("JWE Initialization Vector incorrect type");
	if (typeof e.ciphertext != "string") throw new M("JWE Ciphertext missing or incorrect type");
	if (e.tag !== void 0 && typeof e.tag != "string") throw new M("JWE Authentication Tag incorrect type");
	if (e.protected !== void 0 && typeof e.protected != "string") throw new M("JWE Protected Header incorrect type");
	if (e.encrypted_key !== void 0 && typeof e.encrypted_key != "string") throw new M("JWE Encrypted Key incorrect type");
	if (e.aad !== void 0 && typeof e.aad != "string") throw new M("JWE AAD incorrect type");
	if (e.header !== void 0 && !U(e.header)) throw new M("JWE Shared Unprotected Header incorrect type");
	if (e.unprotected !== void 0 && !U(e.unprotected)) throw new M("JWE Per-Recipient Unprotected Header incorrect type");
	let r;
	if (e.protected) try {
		let t = E(e.protected);
		r = JSON.parse(C.decode(t));
	} catch {
		throw new M("JWE Protected Header is invalid");
	}
	if (!Ve(r, e.header, e.unprotected)) throw new M("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
	let i = {
		...r,
		...e.header,
		...e.unprotected
	};
	if (_n(M, /* @__PURE__ */ new Map(), n?.crit, r, i), i.zip !== void 0) throw new A("JWE \"zip\" (Compression Algorithm) Header Parameter is not supported.");
	let { alg: a, enc: o } = i;
	if (typeof a != "string" || !a) throw new M("missing JWE Algorithm (alg) in JWE Header");
	if (typeof o != "string" || !o) throw new M("missing JWE Encryption Algorithm (enc) in JWE Header");
	let s = n && yn("keyManagementAlgorithms", n.keyManagementAlgorithms), c = n && yn("contentEncryptionAlgorithms", n.contentEncryptionAlgorithms);
	if (s && !s.has(a) || !s && a.startsWith("PBES2")) throw new de("\"alg\" (Algorithm) Header Parameter value not allowed");
	if (c && !c.has(o)) throw new de("\"enc\" (Encryption Algorithm) Header Parameter value not allowed");
	let l;
	if (e.encrypted_key !== void 0) try {
		l = E(e.encrypted_key);
	} catch {
		throw new M("Failed to base64url decode the encrypted_key");
	}
	let u = !1;
	typeof t == "function" && (t = await t(r, e), u = !0);
	let d;
	try {
		d = await hn(a, t, l, i, n);
	} catch (e) {
		if (e instanceof TypeError || e instanceof M || e instanceof A) throw e;
		d = G(o);
	}
	let f, p;
	if (e.iv !== void 0) try {
		f = E(e.iv);
	} catch {
		throw new M("Failed to base64url decode the iv");
	}
	if (e.tag !== void 0) try {
		p = E(e.tag);
	} catch {
		throw new M("Failed to base64url decode the tag");
	}
	let m = S.encode(e.protected ?? ""), h;
	h = e.aad === void 0 ? m : x(m, S.encode("."), S.encode(e.aad));
	let g;
	try {
		g = E(e.ciphertext);
	} catch {
		throw new M("Failed to base64url decode the ciphertext");
	}
	let _ = { plaintext: await ze(o, d, g, f, p, h) };
	if (e.protected !== void 0 && (_.protectedHeader = r), e.aad !== void 0) try {
		_.additionalAuthenticatedData = E(e.aad);
	} catch {
		throw new M("Failed to base64url decode the aad");
	}
	return e.unprotected !== void 0 && (_.sharedUnprotectedHeader = e.unprotected), e.header !== void 0 && (_.unprotectedHeader = e.header), u ? {
		..._,
		key: t
	} : _;
}
var Sn = o((() => {
	D(), Be(), F(), He(), W(), gn(), w(), Nt(), vn(), bn();
}));
//#endregion
//#region node_modules/jose/dist/browser/jwe/compact/decrypt.js
async function Cn(e, t, n) {
	if (e instanceof Uint8Array && (e = C.decode(e)), typeof e != "string") throw new M("Compact JWE must be a string or Uint8Array");
	let { 0: r, 1: i, 2: a, 3: o, 4: s, length: c } = e.split(".");
	if (c !== 5) throw new M("Invalid Compact JWE");
	let l = await xn({
		ciphertext: o,
		iv: a || void 0,
		protected: r,
		tag: s || void 0,
		encrypted_key: i || void 0
	}, t, n), u = {
		plaintext: l.plaintext,
		protectedHeader: l.protectedHeader
	};
	return typeof t == "function" ? {
		...u,
		key: l.key
	} : u;
}
var wn = o((() => {
	Sn(), F(), w();
}));
//#endregion
//#region node_modules/jose/dist/browser/jwe/general/decrypt.js
async function Tn(e, t, n) {
	if (!U(e)) throw new M("General JWE must be an object");
	if (!Array.isArray(e.recipients) || !e.recipients.every(U)) throw new M("JWE Recipients missing or incorrect type");
	if (!e.recipients.length) throw new M("JWE Recipients has no members");
	for (let r of e.recipients) try {
		return await xn({
			aad: e.aad,
			ciphertext: e.ciphertext,
			encrypted_key: r.encrypted_key,
			header: r.header,
			iv: e.iv,
			protected: e.protected,
			tag: e.tag,
			unprotected: e.unprotected
		}, t, n);
	} catch {}
	throw new j();
}
var En = o((() => {
	Sn(), F(), W();
})), Dn, On = o((() => {
	Dn = Symbol();
})), kn, An = o((() => {
	v(), B(), D(), H(), kn = async (e) => {
		if (e instanceof Uint8Array) return {
			kty: "oct",
			k: T(e)
		};
		if (!_(e)) throw TypeError(z(e, ...V, "Uint8Array"));
		if (!e.extractable) throw TypeError("non-extractable CryptoKey cannot be exported as a JWK");
		let { ext: t, key_ops: n, alg: r, use: i, ...a } = await g.subtle.exportKey("jwk", e);
		return a;
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/key/export.js
async function jn(e) {
	return Vt(e);
}
async function Mn(e) {
	return Ht(e);
}
async function Nn(e) {
	return kn(e);
}
var Pn = o((() => {
	Jt(), An();
}));
//#endregion
//#region node_modules/jose/dist/browser/lib/encrypt_key_management.js
async function Fn(e, t, n, r, i = {}) {
	let a, o, s;
	switch (an(e, n, "encrypt"), n = await At.normalizePublicKey?.(n, e) || n, e) {
		case "dir":
			s = n;
			break;
		case "ECDH-ES":
		case "ECDH-ES+A128KW":
		case "ECDH-ES+A192KW":
		case "ECDH-ES+A256KW": {
			if (!$e(n)) throw new A("ECDH with the provided key is not allowed or not supported by your javascript runtime");
			let { apu: c, apv: l } = i, { epk: u } = i;
			u ||= (await Qe(n)).privateKey;
			let { x: d, y: f, crv: p, kty: m } = await Nn(u), h = await Ze(n, u, e === "ECDH-ES" ? t : e, e === "ECDH-ES" ? Mt(t) : parseInt(e.slice(-5, -2), 10), c, l);
			if (o = { epk: {
				x: d,
				crv: p,
				kty: m
			} }, m === "EC" && (o.epk.y = f), c && (o.apu = T(c)), l && (o.apv = T(l)), e === "ECDH-ES") {
				s = h;
				break;
			}
			s = r || G(t);
			let g = e.slice(-6);
			a = await Je(g, h, s);
			break;
		}
		case "RSA1_5":
		case "RSA-OAEP":
		case "RSA-OAEP-256":
		case "RSA-OAEP-384":
		case "RSA-OAEP-512":
			s = r || G(t), a = await ft(e, n, s);
			break;
		case "PBES2-HS256+A128KW":
		case "PBES2-HS384+A192KW":
		case "PBES2-HS512+A256KW": {
			s = r || G(t);
			let { p2c: c, p2s: l } = i;
			({encryptedKey: a, ...o} = await at(e, n, s, c, l));
			break;
		}
		case "A128KW":
		case "A192KW":
		case "A256KW":
			s = r || G(t), a = await Je(e, n, s);
			break;
		case "A128GCMKW":
		case "A192GCMKW":
		case "A256GCMKW": {
			s = r || G(t);
			let { iv: c } = i;
			({encryptedKey: a, ...o} = await fn(e, n, s, c));
			break;
		}
		default: throw new A("Invalid or unsupported \"alg\" (JWE Algorithm) header value");
	}
	return {
		cek: s,
		encryptedKey: a,
		parameters: o
	};
}
var In = o((() => {
	Xe(), et(), st(), mt(), D(), jt(), Nt(), F(), Pn(), sn(), mn();
})), Ln, Rn = o((() => {
	D(), On(), dn(), In(), F(), He(), w(), vn(), Ln = class {
		constructor(e) {
			if (!(e instanceof Uint8Array)) throw TypeError("plaintext must be an instance of Uint8Array");
			this._plaintext = e;
		}
		setKeyManagementParameters(e) {
			if (this._keyManagementParameters) throw TypeError("setKeyManagementParameters can only be called once");
			return this._keyManagementParameters = e, this;
		}
		setProtectedHeader(e) {
			if (this._protectedHeader) throw TypeError("setProtectedHeader can only be called once");
			return this._protectedHeader = e, this;
		}
		setSharedUnprotectedHeader(e) {
			if (this._sharedUnprotectedHeader) throw TypeError("setSharedUnprotectedHeader can only be called once");
			return this._sharedUnprotectedHeader = e, this;
		}
		setUnprotectedHeader(e) {
			if (this._unprotectedHeader) throw TypeError("setUnprotectedHeader can only be called once");
			return this._unprotectedHeader = e, this;
		}
		setAdditionalAuthenticatedData(e) {
			return this._aad = e, this;
		}
		setContentEncryptionKey(e) {
			if (this._cek) throw TypeError("setContentEncryptionKey can only be called once");
			return this._cek = e, this;
		}
		setInitializationVector(e) {
			if (this._iv) throw TypeError("setInitializationVector can only be called once");
			return this._iv = e, this;
		}
		async encrypt(e, t) {
			if (!this._protectedHeader && !this._unprotectedHeader && !this._sharedUnprotectedHeader) throw new M("either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()");
			if (!Ve(this._protectedHeader, this._unprotectedHeader, this._sharedUnprotectedHeader)) throw new M("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
			let n = {
				...this._protectedHeader,
				...this._unprotectedHeader,
				...this._sharedUnprotectedHeader
			};
			if (_n(M, /* @__PURE__ */ new Map(), t?.crit, this._protectedHeader, n), n.zip !== void 0) throw new A("JWE \"zip\" (Compression Algorithm) Header Parameter is not supported.");
			let { alg: r, enc: i } = n;
			if (typeof r != "string" || !r) throw new M("JWE \"alg\" (Algorithm) Header Parameter missing or invalid");
			if (typeof i != "string" || !i) throw new M("JWE \"enc\" (Encryption Algorithm) Header Parameter missing or invalid");
			let a;
			if (this._cek && (r === "dir" || r === "ECDH-ES")) throw TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${r}`);
			let o;
			{
				let n;
				({cek: o, encryptedKey: a, parameters: n} = await Fn(r, i, e, this._cek, this._keyManagementParameters)), n && (t && Dn in t ? this._unprotectedHeader ? this._unprotectedHeader = {
					...this._unprotectedHeader,
					...n
				} : this.setUnprotectedHeader(n) : this._protectedHeader ? this._protectedHeader = {
					...this._protectedHeader,
					...n
				} : this.setProtectedHeader(n));
			}
			let s, c, l;
			c = this._protectedHeader ? S.encode(T(JSON.stringify(this._protectedHeader))) : S.encode(""), this._aad ? (l = T(this._aad), s = x(c, S.encode("."), S.encode(l))) : s = c;
			let { ciphertext: u, tag: d, iv: f } = await un(i, this._plaintext, o, this._iv, s), p = { ciphertext: T(u) };
			return f && (p.iv = T(f)), d && (p.tag = T(d)), a && (p.encrypted_key = T(a)), l && (p.aad = l), this._protectedHeader && (p.protected = C.decode(c)), this._sharedUnprotectedHeader && (p.unprotected = this._sharedUnprotectedHeader), this._unprotectedHeader && (p.header = this._unprotectedHeader), p;
		}
	};
})), zn, Bn, Vn = o((() => {
	Rn(), On(), F(), Nt(), He(), In(), D(), vn(), zn = class {
		constructor(e, t, n) {
			this.parent = e, this.key = t, this.options = n;
		}
		setUnprotectedHeader(e) {
			if (this.unprotectedHeader) throw TypeError("setUnprotectedHeader can only be called once");
			return this.unprotectedHeader = e, this;
		}
		addRecipient(...e) {
			return this.parent.addRecipient(...e);
		}
		encrypt(...e) {
			return this.parent.encrypt(...e);
		}
		done() {
			return this.parent;
		}
	}, Bn = class {
		constructor(e) {
			this._recipients = [], this._plaintext = e;
		}
		addRecipient(e, t) {
			let n = new zn(this, e, { crit: t?.crit });
			return this._recipients.push(n), n;
		}
		setProtectedHeader(e) {
			if (this._protectedHeader) throw TypeError("setProtectedHeader can only be called once");
			return this._protectedHeader = e, this;
		}
		setSharedUnprotectedHeader(e) {
			if (this._unprotectedHeader) throw TypeError("setSharedUnprotectedHeader can only be called once");
			return this._unprotectedHeader = e, this;
		}
		setAdditionalAuthenticatedData(e) {
			return this._aad = e, this;
		}
		async encrypt() {
			if (!this._recipients.length) throw new M("at least one recipient must be added");
			if (this._recipients.length === 1) {
				let [e] = this._recipients, t = await new Ln(this._plaintext).setAdditionalAuthenticatedData(this._aad).setProtectedHeader(this._protectedHeader).setSharedUnprotectedHeader(this._unprotectedHeader).setUnprotectedHeader(e.unprotectedHeader).encrypt(e.key, { ...e.options }), n = {
					ciphertext: t.ciphertext,
					iv: t.iv,
					recipients: [{}],
					tag: t.tag
				};
				return t.aad && (n.aad = t.aad), t.protected && (n.protected = t.protected), t.unprotected && (n.unprotected = t.unprotected), t.encrypted_key && (n.recipients[0].encrypted_key = t.encrypted_key), t.header && (n.recipients[0].header = t.header), n;
			}
			let e;
			for (let t = 0; t < this._recipients.length; t++) {
				let n = this._recipients[t];
				if (!Ve(this._protectedHeader, this._unprotectedHeader, n.unprotectedHeader)) throw new M("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
				let r = {
					...this._protectedHeader,
					...this._unprotectedHeader,
					...n.unprotectedHeader
				}, { alg: i } = r;
				if (typeof i != "string" || !i) throw new M("JWE \"alg\" (Algorithm) Header Parameter missing or invalid");
				if (i === "dir" || i === "ECDH-ES") throw new M("\"dir\" and \"ECDH-ES\" alg may only be used with a single recipient");
				if (typeof r.enc != "string" || !r.enc) throw new M("JWE \"enc\" (Encryption Algorithm) Header Parameter missing or invalid");
				if (!e) e = r.enc;
				else if (e !== r.enc) throw new M("JWE \"enc\" (Encryption Algorithm) Header Parameter must be the same for all recipients");
				if (_n(M, /* @__PURE__ */ new Map(), n.options.crit, this._protectedHeader, r), r.zip !== void 0) throw new A("JWE \"zip\" (Compression Algorithm) Header Parameter is not supported.");
			}
			let t = G(e), n = {
				ciphertext: "",
				iv: "",
				recipients: [],
				tag: ""
			};
			for (let r = 0; r < this._recipients.length; r++) {
				let i = this._recipients[r], a = {};
				n.recipients.push(a);
				let o = {
					...this._protectedHeader,
					...this._unprotectedHeader,
					...i.unprotectedHeader
				}.alg.startsWith("PBES2") ? 2048 + r : void 0;
				if (r === 0) {
					let e = await new Ln(this._plaintext).setAdditionalAuthenticatedData(this._aad).setContentEncryptionKey(t).setProtectedHeader(this._protectedHeader).setSharedUnprotectedHeader(this._unprotectedHeader).setUnprotectedHeader(i.unprotectedHeader).setKeyManagementParameters({ p2c: o }).encrypt(i.key, {
						...i.options,
						[Dn]: !0
					});
					n.ciphertext = e.ciphertext, n.iv = e.iv, n.tag = e.tag, e.aad && (n.aad = e.aad), e.protected && (n.protected = e.protected), e.unprotected && (n.unprotected = e.unprotected), a.encrypted_key = e.encrypted_key, e.header && (a.header = e.header);
					continue;
				}
				let { encryptedKey: s, parameters: c } = await Fn(i.unprotectedHeader?.alg || this._protectedHeader?.alg || this._unprotectedHeader?.alg, e, i.key, t, { p2c: o });
				a.encrypted_key = T(s), (i.unprotectedHeader || c) && (a.header = {
					...i.unprotectedHeader,
					...c
				});
			}
			return n;
		}
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/subtle_dsa.js
function Hn(e, t) {
	let n = `SHA-${e.slice(-3)}`;
	switch (e) {
		case "HS256":
		case "HS384":
		case "HS512": return {
			hash: n,
			name: "HMAC"
		};
		case "PS256":
		case "PS384":
		case "PS512": return {
			hash: n,
			name: "RSA-PSS",
			saltLength: e.slice(-3) >> 3
		};
		case "RS256":
		case "RS384":
		case "RS512": return {
			hash: n,
			name: "RSASSA-PKCS1-v1_5"
		};
		case "ES256":
		case "ES384":
		case "ES512": return {
			hash: n,
			name: "ECDSA",
			namedCurve: t.namedCurve
		};
		case "Ed25519": return { name: "Ed25519" };
		case "EdDSA": return { name: t.name };
		default: throw new A(`alg ${e} is not supported either by JOSE or your javascript runtime`);
	}
}
var Un = o((() => {
	F();
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/get_sign_verify_key.js
async function Wn(e, t, n) {
	if (n === "sign" && (t = await At.normalizePrivateKey(t, e)), n === "verify" && (t = await At.normalizePublicKey(t, e)), _(t)) return Me(t, e, n), t;
	if (t instanceof Uint8Array) {
		if (!e.startsWith("HS")) throw TypeError(z(t, ...V));
		return g.subtle.importKey("raw", t, {
			hash: `SHA-${e.slice(-3)}`,
			name: "HMAC"
		}, !1, [n]);
	}
	throw TypeError(z(t, ...V, "Uint8Array", "JSON Web Key"));
}
var Gn = o((() => {
	v(), Ne(), B(), H(), jt();
})), Kn, qn = o((() => {
	Un(), v(), dt(), Gn(), Kn = async (e, t, n, r) => {
		let i = await Wn(e, t, "verify");
		ut(e, i);
		let a = Hn(e, i.algorithm);
		try {
			return await g.subtle.verify(a, i, n, r);
		} catch {
			return !1;
		}
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jws/flattened/verify.js
async function Jn(e, t, n) {
	if (!U(e)) throw new N("Flattened JWS must be an object");
	if (e.protected === void 0 && e.header === void 0) throw new N("Flattened JWS must have either of the \"protected\" or \"header\" members");
	if (e.protected !== void 0 && typeof e.protected != "string") throw new N("JWS Protected Header incorrect type");
	if (e.payload === void 0) throw new N("JWS Payload missing");
	if (typeof e.signature != "string") throw new N("JWS Signature missing or incorrect type");
	if (e.header !== void 0 && !U(e.header)) throw new N("JWS Unprotected Header incorrect type");
	let r = {};
	if (e.protected) try {
		let t = E(e.protected);
		r = JSON.parse(C.decode(t));
	} catch {
		throw new N("JWS Protected Header is invalid");
	}
	if (!Ve(r, e.header)) throw new N("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
	let i = {
		...r,
		...e.header
	}, a = _n(N, /* @__PURE__ */ new Map([["b64", !0]]), n?.crit, r, i), o = !0;
	if (a.has("b64") && (o = r.b64, typeof o != "boolean")) throw new N("The \"b64\" (base64url-encode payload) Header Parameter must be a boolean");
	let { alg: s } = i;
	if (typeof s != "string" || !s) throw new N("JWS \"alg\" (Algorithm) Header Parameter missing or invalid");
	let c = n && yn("algorithms", n.algorithms);
	if (c && !c.has(s)) throw new de("\"alg\" (Algorithm) Header Parameter value not allowed");
	if (o) {
		if (typeof e.payload != "string") throw new N("JWS Payload must be a string");
	} else if (typeof e.payload != "string" && !(e.payload instanceof Uint8Array)) throw new N("JWS Payload must be a string or an Uint8Array instance");
	let l = !1;
	typeof t == "function" ? (t = await t(r, e), l = !0, on(s, t, "verify"), ht(t) && (t = await Qt(t, s))) : on(s, t, "verify");
	let u = x(S.encode(e.protected ?? ""), S.encode("."), typeof e.payload == "string" ? S.encode(e.payload) : e.payload), d;
	try {
		d = E(e.signature);
	} catch {
		throw new N("Failed to base64url decode the signature");
	}
	if (!await Kn(s, t, d, u)) throw new _e();
	let f;
	if (o) try {
		f = E(e.payload);
	} catch {
		throw new N("Failed to base64url decode the payload");
	}
	else f = typeof e.payload == "string" ? S.encode(e.payload) : e.payload;
	let p = { payload: f };
	return e.protected !== void 0 && (p.protectedHeader = r), e.header !== void 0 && (p.unprotectedHeader = e.header), l ? {
		...p,
		key: t
	} : p;
}
var Yn = o((() => {
	D(), qn(), F(), w(), He(), W(), sn(), vn(), bn(), yt(), $t();
}));
//#endregion
//#region node_modules/jose/dist/browser/jws/compact/verify.js
async function Xn(e, t, n) {
	if (e instanceof Uint8Array && (e = C.decode(e)), typeof e != "string") throw new N("Compact JWS must be a string or Uint8Array");
	let { 0: r, 1: i, 2: a, length: o } = e.split(".");
	if (o !== 3) throw new N("Invalid Compact JWS");
	let s = await Jn({
		payload: i,
		protected: r,
		signature: a
	}, t, n), c = {
		payload: s.payload,
		protectedHeader: s.protectedHeader
	};
	return typeof t == "function" ? {
		...c,
		key: s.key
	} : c;
}
var Zn = o((() => {
	Yn(), F(), w();
}));
//#endregion
//#region node_modules/jose/dist/browser/jws/general/verify.js
async function Qn(e, t, n) {
	if (!U(e)) throw new N("General JWS must be an object");
	if (!Array.isArray(e.signatures) || !e.signatures.every(U)) throw new N("JWS Signatures missing or incorrect type");
	for (let r of e.signatures) try {
		return await Jn({
			header: r.header,
			payload: e.payload,
			protected: r.protected,
			signature: r.signature
		}, t, n);
	} catch {}
	throw new _e();
}
var $n = o((() => {
	Yn(), F(), W();
})), J, er = o((() => {
	J = (e) => Math.floor(e.getTime() / 1e3);
})), tr, nr, rr, ir, ar, or, sr, cr = o((() => {
	tr = 60, nr = 3600, rr = nr * 24, ir = rr * 7, ar = rr * 365.25, or = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i, sr = (e) => {
		let t = or.exec(e);
		if (!t || t[4] && t[1]) throw TypeError("Invalid time period format");
		let n = parseFloat(t[2]), r = t[3].toLowerCase(), i;
		switch (r) {
			case "sec":
			case "secs":
			case "second":
			case "seconds":
			case "s":
				i = Math.round(n);
				break;
			case "minute":
			case "minutes":
			case "min":
			case "mins":
			case "m":
				i = Math.round(n * tr);
				break;
			case "hour":
			case "hours":
			case "hr":
			case "hrs":
			case "h":
				i = Math.round(n * nr);
				break;
			case "day":
			case "days":
			case "d":
				i = Math.round(n * rr);
				break;
			case "week":
			case "weeks":
			case "w":
				i = Math.round(n * ir);
				break;
			default: i = Math.round(n * ar);
		}
		return t[1] === "-" || t[4] === "ago" ? -i : i;
	};
})), lr, ur, dr, fr = o((() => {
	F(), w(), er(), cr(), W(), lr = (e) => e.toLowerCase().replace(/^application\//, ""), ur = (e, t) => typeof e == "string" ? t.includes(e) : Array.isArray(e) ? t.some(Set.prototype.has.bind(new Set(e))) : !1, dr = (e, t, n = {}) => {
		let r;
		try {
			r = JSON.parse(C.decode(t));
		} catch {}
		if (!U(r)) throw new P("JWT Claims Set must be a top-level JSON object");
		let { typ: i } = n;
		if (i && (typeof e.typ != "string" || lr(e.typ) !== lr(i))) throw new k("unexpected \"typ\" JWT header value", r, "typ", "check_failed");
		let { requiredClaims: a = [], issuer: o, subject: s, audience: c, maxTokenAge: l } = n, u = [...a];
		l !== void 0 && u.push("iat"), c !== void 0 && u.push("aud"), s !== void 0 && u.push("sub"), o !== void 0 && u.push("iss");
		for (let e of new Set(u.reverse())) if (!(e in r)) throw new k(`missing required "${e}" claim`, r, e, "missing");
		if (o && !(Array.isArray(o) ? o : [o]).includes(r.iss)) throw new k("unexpected \"iss\" claim value", r, "iss", "check_failed");
		if (s && r.sub !== s) throw new k("unexpected \"sub\" claim value", r, "sub", "check_failed");
		if (c && !ur(r.aud, typeof c == "string" ? [c] : c)) throw new k("unexpected \"aud\" claim value", r, "aud", "check_failed");
		let d;
		switch (typeof n.clockTolerance) {
			case "string":
				d = sr(n.clockTolerance);
				break;
			case "number":
				d = n.clockTolerance;
				break;
			case "undefined":
				d = 0;
				break;
			default: throw TypeError("Invalid clockTolerance option type");
		}
		let { currentDate: f } = n, p = J(f || /* @__PURE__ */ new Date());
		if ((r.iat !== void 0 || l) && typeof r.iat != "number") throw new k("\"iat\" claim must be a number", r, "iat", "invalid");
		if (r.nbf !== void 0) {
			if (typeof r.nbf != "number") throw new k("\"nbf\" claim must be a number", r, "nbf", "invalid");
			if (r.nbf > p + d) throw new k("\"nbf\" claim timestamp check failed", r, "nbf", "check_failed");
		}
		if (r.exp !== void 0) {
			if (typeof r.exp != "number") throw new k("\"exp\" claim must be a number", r, "exp", "invalid");
			if (r.exp <= p - d) throw new ue("\"exp\" claim timestamp check failed", r, "exp", "check_failed");
		}
		if (l) {
			let e = p - r.iat, t = typeof l == "number" ? l : sr(l);
			if (e - d > t) throw new ue("\"iat\" claim timestamp check failed (too far in the past)", r, "iat", "check_failed");
			if (e < 0 - d) throw new k("\"iat\" claim timestamp check failed (it should be in the past)", r, "iat", "check_failed");
		}
		return r;
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jwt/verify.js
async function pr(e, t, n) {
	let r = await Xn(e, t, n);
	if (r.protectedHeader.crit?.includes("b64") && r.protectedHeader.b64 === !1) throw new P("JWTs MUST NOT use unencoded payload");
	let i = {
		payload: dr(r.protectedHeader, r.payload, n),
		protectedHeader: r.protectedHeader
	};
	return typeof t == "function" ? {
		...i,
		key: r.key
	} : i;
}
var mr = o((() => {
	Zn(), fr(), F();
}));
//#endregion
//#region node_modules/jose/dist/browser/jwt/decrypt.js
async function hr(e, t, n) {
	let r = await Cn(e, t, n), i = dr(r.protectedHeader, r.plaintext, n), { protectedHeader: a } = r;
	if (a.iss !== void 0 && a.iss !== i.iss) throw new k("replicated \"iss\" claim header parameter mismatch", i, "iss", "mismatch");
	if (a.sub !== void 0 && a.sub !== i.sub) throw new k("replicated \"sub\" claim header parameter mismatch", i, "sub", "mismatch");
	if (a.aud !== void 0 && JSON.stringify(a.aud) !== JSON.stringify(i.aud)) throw new k("replicated \"aud\" claim header parameter mismatch", i, "aud", "mismatch");
	let o = {
		payload: i,
		protectedHeader: a
	};
	return typeof t == "function" ? {
		...o,
		key: r.key
	} : o;
}
var gr = o((() => {
	wn(), fr(), F();
})), _r, vr = o((() => {
	Rn(), _r = class {
		constructor(e) {
			this._flattened = new Ln(e);
		}
		setContentEncryptionKey(e) {
			return this._flattened.setContentEncryptionKey(e), this;
		}
		setInitializationVector(e) {
			return this._flattened.setInitializationVector(e), this;
		}
		setProtectedHeader(e) {
			return this._flattened.setProtectedHeader(e), this;
		}
		setKeyManagementParameters(e) {
			return this._flattened.setKeyManagementParameters(e), this;
		}
		async encrypt(e, t) {
			let n = await this._flattened.encrypt(e, t);
			return [
				n.protected,
				n.encrypted_key,
				n.iv,
				n.ciphertext,
				n.tag
			].join(".");
		}
	};
})), yr, br = o((() => {
	Un(), v(), dt(), Gn(), yr = async (e, t, n) => {
		let r = await Wn(e, t, "sign");
		ut(e, r);
		let i = await g.subtle.sign(Hn(e, r.algorithm), r, n);
		return new Uint8Array(i);
	};
})), xr, Sr = o((() => {
	D(), br(), He(), F(), w(), sn(), vn(), xr = class {
		constructor(e) {
			if (!(e instanceof Uint8Array)) throw TypeError("payload must be an instance of Uint8Array");
			this._payload = e;
		}
		setProtectedHeader(e) {
			if (this._protectedHeader) throw TypeError("setProtectedHeader can only be called once");
			return this._protectedHeader = e, this;
		}
		setUnprotectedHeader(e) {
			if (this._unprotectedHeader) throw TypeError("setUnprotectedHeader can only be called once");
			return this._unprotectedHeader = e, this;
		}
		async sign(e, t) {
			if (!this._protectedHeader && !this._unprotectedHeader) throw new N("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
			if (!Ve(this._protectedHeader, this._unprotectedHeader)) throw new N("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
			let n = {
				...this._protectedHeader,
				...this._unprotectedHeader
			}, r = _n(N, /* @__PURE__ */ new Map([["b64", !0]]), t?.crit, this._protectedHeader, n), i = !0;
			if (r.has("b64") && (i = this._protectedHeader.b64, typeof i != "boolean")) throw new N("The \"b64\" (base64url-encode payload) Header Parameter must be a boolean");
			let { alg: a } = n;
			if (typeof a != "string" || !a) throw new N("JWS \"alg\" (Algorithm) Header Parameter missing or invalid");
			on(a, e, "sign");
			let o = this._payload;
			i && (o = S.encode(T(o)));
			let s;
			s = this._protectedHeader ? S.encode(T(JSON.stringify(this._protectedHeader))) : S.encode("");
			let c = x(s, S.encode("."), o), l = await yr(a, e, c), u = {
				signature: T(l),
				payload: ""
			};
			return i && (u.payload = C.decode(o)), this._unprotectedHeader && (u.header = this._unprotectedHeader), this._protectedHeader && (u.protected = C.decode(s)), u;
		}
	};
})), Cr, wr = o((() => {
	Sr(), Cr = class {
		constructor(e) {
			this._flattened = new xr(e);
		}
		setProtectedHeader(e) {
			return this._flattened.setProtectedHeader(e), this;
		}
		async sign(e, t) {
			let n = await this._flattened.sign(e, t);
			if (n.payload === void 0) throw TypeError("use the flattened module for creating JWS with b64: false");
			return `${n.protected}.${n.payload}.${n.signature}`;
		}
	};
})), Tr, Er, Dr = o((() => {
	Sr(), F(), Tr = class {
		constructor(e, t, n) {
			this.parent = e, this.key = t, this.options = n;
		}
		setProtectedHeader(e) {
			if (this.protectedHeader) throw TypeError("setProtectedHeader can only be called once");
			return this.protectedHeader = e, this;
		}
		setUnprotectedHeader(e) {
			if (this.unprotectedHeader) throw TypeError("setUnprotectedHeader can only be called once");
			return this.unprotectedHeader = e, this;
		}
		addSignature(...e) {
			return this.parent.addSignature(...e);
		}
		sign(...e) {
			return this.parent.sign(...e);
		}
		done() {
			return this.parent;
		}
	}, Er = class {
		constructor(e) {
			this._signatures = [], this._payload = e;
		}
		addSignature(e, t) {
			let n = new Tr(this, e, t);
			return this._signatures.push(n), n;
		}
		async sign() {
			if (!this._signatures.length) throw new N("at least one signature must be added");
			let e = {
				signatures: [],
				payload: ""
			};
			for (let t = 0; t < this._signatures.length; t++) {
				let n = this._signatures[t], r = new xr(this._payload);
				r.setProtectedHeader(n.protectedHeader), r.setUnprotectedHeader(n.unprotectedHeader);
				let { payload: i, ...a } = await r.sign(n.key, n.options);
				if (t === 0) e.payload = i;
				else if (e.payload !== i) throw new N("inconsistent use of JWS Unencoded Payload (RFC7797)");
				e.signatures.push(a);
			}
			return e;
		}
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jwt/produce.js
function Y(e, t) {
	if (!Number.isFinite(t)) throw TypeError(`Invalid ${e} input`);
	return t;
}
var Or, kr = o((() => {
	er(), W(), cr(), Or = class {
		constructor(e = {}) {
			if (!U(e)) throw TypeError("JWT Claims Set MUST be an object");
			this._payload = e;
		}
		setIssuer(e) {
			return this._payload = {
				...this._payload,
				iss: e
			}, this;
		}
		setSubject(e) {
			return this._payload = {
				...this._payload,
				sub: e
			}, this;
		}
		setAudience(e) {
			return this._payload = {
				...this._payload,
				aud: e
			}, this;
		}
		setJti(e) {
			return this._payload = {
				...this._payload,
				jti: e
			}, this;
		}
		setNotBefore(e) {
			return this._payload = typeof e == "number" ? {
				...this._payload,
				nbf: Y("setNotBefore", e)
			} : e instanceof Date ? {
				...this._payload,
				nbf: Y("setNotBefore", J(e))
			} : {
				...this._payload,
				nbf: J(/* @__PURE__ */ new Date()) + sr(e)
			}, this;
		}
		setExpirationTime(e) {
			return this._payload = typeof e == "number" ? {
				...this._payload,
				exp: Y("setExpirationTime", e)
			} : e instanceof Date ? {
				...this._payload,
				exp: Y("setExpirationTime", J(e))
			} : {
				...this._payload,
				exp: J(/* @__PURE__ */ new Date()) + sr(e)
			}, this;
		}
		setIssuedAt(e) {
			return this._payload = e === void 0 ? {
				...this._payload,
				iat: J(/* @__PURE__ */ new Date())
			} : e instanceof Date ? {
				...this._payload,
				iat: Y("setIssuedAt", J(e))
			} : typeof e == "string" ? {
				...this._payload,
				iat: Y("setIssuedAt", J(/* @__PURE__ */ new Date()) + sr(e))
			} : {
				...this._payload,
				iat: Y("setIssuedAt", e)
			}, this;
		}
	};
})), Ar, jr = o((() => {
	wr(), F(), w(), kr(), Ar = class extends Or {
		setProtectedHeader(e) {
			return this._protectedHeader = e, this;
		}
		async sign(e, t) {
			let n = new Cr(S.encode(JSON.stringify(this._payload)));
			if (n.setProtectedHeader(this._protectedHeader), Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === !1) throw new P("JWTs MUST NOT use unencoded payload");
			return n.sign(e, t);
		}
	};
})), Mr, Nr = o((() => {
	vr(), w(), kr(), Mr = class extends Or {
		setProtectedHeader(e) {
			if (this._protectedHeader) throw TypeError("setProtectedHeader can only be called once");
			return this._protectedHeader = e, this;
		}
		setKeyManagementParameters(e) {
			if (this._keyManagementParameters) throw TypeError("setKeyManagementParameters can only be called once");
			return this._keyManagementParameters = e, this;
		}
		setContentEncryptionKey(e) {
			if (this._cek) throw TypeError("setContentEncryptionKey can only be called once");
			return this._cek = e, this;
		}
		setInitializationVector(e) {
			if (this._iv) throw TypeError("setInitializationVector can only be called once");
			return this._iv = e, this;
		}
		replicateIssuerAsHeader() {
			return this._replicateIssuerAsHeader = !0, this;
		}
		replicateSubjectAsHeader() {
			return this._replicateSubjectAsHeader = !0, this;
		}
		replicateAudienceAsHeader() {
			return this._replicateAudienceAsHeader = !0, this;
		}
		async encrypt(e, t) {
			let n = new _r(S.encode(JSON.stringify(this._payload)));
			return this._replicateIssuerAsHeader && (this._protectedHeader = {
				...this._protectedHeader,
				iss: this._payload.iss
			}), this._replicateSubjectAsHeader && (this._protectedHeader = {
				...this._protectedHeader,
				sub: this._payload.sub
			}), this._replicateAudienceAsHeader && (this._protectedHeader = {
				...this._protectedHeader,
				aud: this._payload.aud
			}), n.setProtectedHeader(this._protectedHeader), this._iv && n.setInitializationVector(this._iv), this._cek && n.setContentEncryptionKey(this._cek), this._keyManagementParameters && n.setKeyManagementParameters(this._keyManagementParameters), n.encrypt(e, t);
		}
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jwk/thumbprint.js
async function Pr(e, t) {
	if (!U(e)) throw TypeError("JWK must be an object");
	if (t ??= "sha256", t !== "sha256" && t !== "sha384" && t !== "sha512") throw TypeError("digestAlgorithm must one of \"sha256\", \"sha384\", or \"sha512\"");
	let n;
	switch (e.kty) {
		case "EC":
			X(e.crv, "\"crv\" (Curve) Parameter"), X(e.x, "\"x\" (X Coordinate) Parameter"), X(e.y, "\"y\" (Y Coordinate) Parameter"), n = {
				crv: e.crv,
				kty: e.kty,
				x: e.x,
				y: e.y
			};
			break;
		case "OKP":
			X(e.crv, "\"crv\" (Subtype of Key Pair) Parameter"), X(e.x, "\"x\" (Public Key) Parameter"), n = {
				crv: e.crv,
				kty: e.kty,
				x: e.x
			};
			break;
		case "RSA":
			X(e.e, "\"e\" (Exponent) Parameter"), X(e.n, "\"n\" (Modulus) Parameter"), n = {
				e: e.e,
				kty: e.kty,
				n: e.n
			};
			break;
		case "oct":
			X(e.k, "\"k\" (Key Value) Parameter"), n = {
				k: e.k,
				kty: e.kty
			};
			break;
		default: throw new A("\"kty\" (Key Type) Parameter missing or unsupported");
	}
	let r = S.encode(JSON.stringify(n));
	return T(await y(t, r));
}
async function Fr(e, t) {
	t ??= "sha256";
	let n = await Pr(e, t);
	return `urn:ietf:params:oauth:jwk-thumbprint:sha-${t.slice(-3)}:${n}`;
}
var X, Ir = o((() => {
	b(), D(), F(), w(), W(), X = (e, t) => {
		if (typeof e != "string" || !e) throw new fe(`${t} missing or invalid`);
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jwk/embedded.js
async function Lr(e, t) {
	let n = {
		...e,
		...t?.header
	};
	if (!U(n.jwk)) throw new N("\"jwk\" (JSON Web Key) Header Parameter must be a JSON object");
	let r = await Qt({
		...n.jwk,
		ext: !0
	}, n.alg);
	if (r instanceof Uint8Array || r.type !== "public") throw new N("\"jwk\" (JSON Web Key) Header Parameter must be a public key");
	return r;
}
var Rr = o((() => {
	$t(), W(), F();
}));
//#endregion
//#region node_modules/jose/dist/browser/jwks/local.js
function zr(e) {
	switch (typeof e == "string" && e.slice(0, 2)) {
		case "RS":
		case "PS": return "RSA";
		case "ES": return "EC";
		case "Ed": return "OKP";
		default: throw new A("Unsupported \"alg\" value for a JSON Web Key Set");
	}
}
function Br(e) {
	return e && typeof e == "object" && Array.isArray(e.keys) && e.keys.every(Vr);
}
function Vr(e) {
	return U(e);
}
function Hr(e) {
	return typeof structuredClone == "function" ? structuredClone(e) : JSON.parse(JSON.stringify(e));
}
async function Ur(e, t, n) {
	let r = e.get(t) || e.set(t, {}).get(t);
	if (r[n] === void 0) {
		let e = await Qt({
			...t,
			ext: !0
		}, n);
		if (e instanceof Uint8Array || e.type !== "public") throw new pe("JSON Web Key Set members must be public keys");
		r[n] = e;
	}
	return r[n];
}
function Wr(e) {
	let t = new Gr(e), n = async (e, n) => t.getKey(e, n);
	return Object.defineProperties(n, { jwks: {
		value: () => Hr(t._jwks),
		enumerable: !0,
		configurable: !1,
		writable: !1
	} }), n;
}
var Gr, Kr = o((() => {
	$t(), F(), W(), Gr = class {
		constructor(e) {
			if (this._cached = /* @__PURE__ */ new WeakMap(), !Br(e)) throw new pe("JSON Web Key Set malformed");
			this._jwks = Hr(e);
		}
		async getKey(e, t) {
			let { alg: n, kid: r } = {
				...e,
				...t?.header
			}, i = zr(n), a = this._jwks.keys.filter((e) => {
				let t = i === e.kty;
				if (t && typeof r == "string" && (t = r === e.kid), t && typeof e.alg == "string" && (t = n === e.alg), t && typeof e.use == "string" && (t = e.use === "sig"), t && Array.isArray(e.key_ops) && (t = e.key_ops.includes("verify")), t) switch (n) {
					case "ES256":
						t = e.crv === "P-256";
						break;
					case "ES256K":
						t = e.crv === "secp256k1";
						break;
					case "ES384":
						t = e.crv === "P-384";
						break;
					case "ES512":
						t = e.crv === "P-521";
						break;
					case "Ed25519":
						t = e.crv === "Ed25519";
						break;
					case "EdDSA": t = e.crv === "Ed25519" || e.crv === "Ed448";
				}
				return t;
			}), { 0: o, length: s } = a;
			if (s === 0) throw new me();
			if (s !== 1) {
				let e = new he(), { _cached: t } = this;
				throw e[Symbol.asyncIterator] = async function* () {
					for (let e of a) try {
						yield await Ur(t, e, n);
					} catch {}
				}, e;
			}
			return Ur(this._cached, o, n);
		}
	};
})), qr, Jr = o((() => {
	F(), qr = async (e, t, n) => {
		let r, i, a = !1;
		typeof AbortController == "function" && (r = new AbortController(), i = setTimeout(() => {
			a = !0, r.abort();
		}, t));
		let o = await fetch(e.href, {
			signal: r ? r.signal : void 0,
			redirect: "manual",
			headers: n.headers
		}).catch((e) => {
			throw a ? new ge() : e;
		});
		if (i !== void 0 && clearTimeout(i), o.status !== 200) throw new O("Expected 200 OK from the JSON Web Key Set HTTP response");
		try {
			return await o.json();
		} catch {
			throw new O("Failed to parse the JSON Web Key Set HTTP response as JSON");
		}
	};
}));
//#endregion
//#region node_modules/jose/dist/browser/jwks/remote.js
function Yr() {
	return typeof WebSocketPair < "u" || typeof navigator < "u" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime < "u" && EdgeRuntime === "vercel";
}
function Xr(e, t) {
	return !(typeof e != "object" || !e || !("uat" in e) || typeof e.uat != "number" || Date.now() - e.uat >= t || !("jwks" in e) || !U(e.jwks) || !Array.isArray(e.jwks.keys) || !Array.prototype.every.call(e.jwks.keys, U));
}
function Zr(e, t) {
	let n = new ei(e, t), r = async (e, t) => n.getKey(e, t);
	return Object.defineProperties(r, {
		coolingDown: {
			get: () => n.coolingDown(),
			enumerable: !0,
			configurable: !1
		},
		fresh: {
			get: () => n.fresh(),
			enumerable: !0,
			configurable: !1
		},
		reload: {
			value: () => n.reload(),
			enumerable: !0,
			configurable: !1,
			writable: !1
		},
		reloading: {
			get: () => !!n._pendingFetch,
			enumerable: !0,
			configurable: !1
		},
		jwks: {
			value: () => n._local?.jwks(),
			enumerable: !0,
			configurable: !1,
			writable: !1
		}
	}), r;
}
var Qr, $r, ei, ti, ni = o((() => {
	Jr(), F(), Kr(), W(), (typeof navigator > "u" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) && (Qr = "jose/v5.10.0"), $r = Symbol(), ei = class {
		constructor(e, t) {
			if (!(e instanceof URL)) throw TypeError("url must be an instance of URL");
			this._url = new URL(e.href), this._options = {
				agent: t?.agent,
				headers: t?.headers
			}, this._timeoutDuration = typeof t?.timeoutDuration == "number" ? t?.timeoutDuration : 5e3, this._cooldownDuration = typeof t?.cooldownDuration == "number" ? t?.cooldownDuration : 3e4, this._cacheMaxAge = typeof t?.cacheMaxAge == "number" ? t?.cacheMaxAge : 6e5, t?.[$r] !== void 0 && (this._cache = t?.[$r], Xr(t?.[$r], this._cacheMaxAge) && (this._jwksTimestamp = this._cache.uat, this._local = Wr(this._cache.jwks)));
		}
		coolingDown() {
			return typeof this._jwksTimestamp == "number" && Date.now() < this._jwksTimestamp + this._cooldownDuration;
		}
		fresh() {
			return typeof this._jwksTimestamp == "number" && Date.now() < this._jwksTimestamp + this._cacheMaxAge;
		}
		async getKey(e, t) {
			(!this._local || !this.fresh()) && await this.reload();
			try {
				return await this._local(e, t);
			} catch (n) {
				if (n instanceof me && this.coolingDown() === !1) return await this.reload(), this._local(e, t);
				throw n;
			}
		}
		async reload() {
			this._pendingFetch && Yr() && (this._pendingFetch = void 0);
			let e = new Headers(this._options.headers);
			Qr && !e.has("User-Agent") && (e.set("User-Agent", Qr), this._options.headers = Object.fromEntries(e.entries())), this._pendingFetch ||= qr(this._url, this._timeoutDuration, this._options).then((e) => {
				this._local = Wr(e), this._cache && (this._cache.uat = Date.now(), this._cache.jwks = e), this._jwksTimestamp = Date.now(), this._pendingFetch = void 0;
			}).catch((e) => {
				throw this._pendingFetch = void 0, e;
			}), await this._pendingFetch;
		}
	}, ti = $r;
})), ri, ii = o((() => {
	D(), w(), F(), fr(), kr(), ri = class extends Or {
		encode() {
			return `${T(JSON.stringify({ alg: "none" }))}.${T(JSON.stringify(this._payload))}.`;
		}
		static decode(e, t) {
			if (typeof e != "string") throw new P("Unsecured JWT must be a string");
			let { 0: n, 1: r, 2: i, length: a } = e.split(".");
			if (a !== 3 || i !== "") throw new P("Invalid Unsecured JWT");
			let o;
			try {
				if (o = JSON.parse(C.decode(E(n))), o.alg !== "none") throw Error();
			} catch {
				throw new P("Invalid Unsecured JWT");
			}
			return {
				payload: dr(o, E(r), t),
				header: o
			};
		}
	};
})), ai = /* @__PURE__ */ c({
	decode: () => si,
	encode: () => oi
}), oi, si, ci = o((() => {
	D(), oi = T, si = E;
}));
//#endregion
//#region node_modules/jose/dist/browser/util/decode_protected_header.js
function li(e) {
	let t;
	if (typeof e == "string") {
		let n = e.split(".");
		(n.length === 3 || n.length === 5) && ([t] = n);
	} else if (typeof e == "object" && e) {
		if ("protected" in e) t = e.protected;
		else throw TypeError("Token does not contain a Protected Header");
	}
	try {
		if (typeof t != "string" || !t) throw Error();
		let e = JSON.parse(C.decode(si(t)));
		if (!U(e)) throw Error();
		return e;
	} catch {
		throw TypeError("Invalid Token or Protected Header formatting");
	}
}
var ui = o((() => {
	ci(), w(), W();
}));
//#endregion
//#region node_modules/jose/dist/browser/util/decode_jwt.js
function di(e) {
	if (typeof e != "string") throw new P("JWTs must use Compact JWS serialization, JWT must be a string");
	let { 1: t, length: n } = e.split(".");
	if (n === 5) throw new P("Only JWTs using Compact JWS serialization can be decoded");
	if (n !== 3) throw new P("Invalid JWT");
	if (!t) throw new P("JWTs must contain a payload");
	let r;
	try {
		r = si(t);
	} catch {
		throw new P("Failed to base64url decode the payload");
	}
	let i;
	try {
		i = JSON.parse(C.decode(r));
	} catch {
		throw new P("Failed to parse the decoded payload as JSON");
	}
	if (!U(i)) throw new P("Invalid JWT Claims Set");
	return i;
}
var fi = o((() => {
	ci(), w(), W(), F();
}));
//#endregion
//#region node_modules/jose/dist/browser/runtime/generate.js
async function pi(e, t) {
	let n, r, i;
	switch (e) {
		case "HS256":
		case "HS384":
		case "HS512":
			n = parseInt(e.slice(-3), 10), r = {
				name: "HMAC",
				hash: `SHA-${n}`,
				length: n
			}, i = ["sign", "verify"];
			break;
		case "A128CBC-HS256":
		case "A192CBC-HS384":
		case "A256CBC-HS512": return n = parseInt(e.slice(-3), 10), ve(new Uint8Array(n >> 3));
		case "A128KW":
		case "A192KW":
		case "A256KW":
			n = parseInt(e.slice(1, 4), 10), r = {
				name: "AES-KW",
				length: n
			}, i = ["wrapKey", "unwrapKey"];
			break;
		case "A128GCMKW":
		case "A192GCMKW":
		case "A256GCMKW":
		case "A128GCM":
		case "A192GCM":
		case "A256GCM":
			n = parseInt(e.slice(1, 4), 10), r = {
				name: "AES-GCM",
				length: n
			}, i = ["encrypt", "decrypt"];
			break;
		default: throw new A("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
	}
	return g.subtle.generateKey(r, t?.extractable ?? !1, i);
}
function mi(e) {
	let t = e?.modulusLength ?? 2048;
	if (typeof t != "number" || t < 2048) throw new A("Invalid or unsupported modulusLength option provided, 2048 bits or larger keys must be used");
	return t;
}
async function hi(e, t) {
	let n, r;
	switch (e) {
		case "PS256":
		case "PS384":
		case "PS512":
			n = {
				name: "RSA-PSS",
				hash: `SHA-${e.slice(-3)}`,
				publicExponent: new Uint8Array([
					1,
					0,
					1
				]),
				modulusLength: mi(t)
			}, r = ["sign", "verify"];
			break;
		case "RS256":
		case "RS384":
		case "RS512":
			n = {
				name: "RSASSA-PKCS1-v1_5",
				hash: `SHA-${e.slice(-3)}`,
				publicExponent: new Uint8Array([
					1,
					0,
					1
				]),
				modulusLength: mi(t)
			}, r = ["sign", "verify"];
			break;
		case "RSA-OAEP":
		case "RSA-OAEP-256":
		case "RSA-OAEP-384":
		case "RSA-OAEP-512":
			n = {
				name: "RSA-OAEP",
				hash: `SHA-${parseInt(e.slice(-3), 10) || 1}`,
				publicExponent: new Uint8Array([
					1,
					0,
					1
				]),
				modulusLength: mi(t)
			}, r = [
				"decrypt",
				"unwrapKey",
				"encrypt",
				"wrapKey"
			];
			break;
		case "ES256":
			n = {
				name: "ECDSA",
				namedCurve: "P-256"
			}, r = ["sign", "verify"];
			break;
		case "ES384":
			n = {
				name: "ECDSA",
				namedCurve: "P-384"
			}, r = ["sign", "verify"];
			break;
		case "ES512":
			n = {
				name: "ECDSA",
				namedCurve: "P-521"
			}, r = ["sign", "verify"];
			break;
		case "Ed25519":
			n = { name: "Ed25519" }, r = ["sign", "verify"];
			break;
		case "EdDSA": {
			r = ["sign", "verify"];
			let e = t?.crv ?? "Ed25519";
			switch (e) {
				case "Ed25519":
				case "Ed448":
					n = { name: e };
					break;
				default: throw new A("Invalid or unsupported crv option provided");
			}
			break;
		}
		case "ECDH-ES":
		case "ECDH-ES+A128KW":
		case "ECDH-ES+A192KW":
		case "ECDH-ES+A256KW": {
			r = ["deriveKey", "deriveBits"];
			let e = t?.crv ?? "P-256";
			switch (e) {
				case "P-256":
				case "P-384":
				case "P-521":
					n = {
						name: "ECDH",
						namedCurve: e
					};
					break;
				case "X25519":
				case "X448":
					n = { name: e };
					break;
				default: throw new A("Invalid or unsupported crv option provided, supported values are P-256, P-384, P-521, X25519, and X448");
			}
			break;
		}
		default: throw new A("Invalid or unsupported JWK \"alg\" (Algorithm) Parameter value");
	}
	return g.subtle.generateKey(n, t?.extractable ?? !1, r);
}
var gi = o((() => {
	v(), F(), ye();
}));
//#endregion
//#region node_modules/jose/dist/browser/key/generate_key_pair.js
async function _i(e, t) {
	return hi(e, t);
}
var vi = o((() => {
	gi();
}));
//#endregion
//#region node_modules/jose/dist/browser/key/generate_secret.js
async function yi(e, t) {
	return pi(e, t);
}
var bi = o((() => {
	gi();
})), xi, Si = o((() => {
	xi = "WebCryptoAPI";
})), Ci, wi = o((() => {
	Si(), Ci = xi;
})), Ti = /* @__PURE__ */ c({
	CompactEncrypt: () => _r,
	CompactSign: () => Cr,
	EmbeddedJWK: () => Lr,
	EncryptJWT: () => Mr,
	FlattenedEncrypt: () => Ln,
	FlattenedSign: () => xr,
	GeneralEncrypt: () => Bn,
	GeneralSign: () => Er,
	SignJWT: () => Ar,
	UnsecuredJWT: () => ri,
	base64url: () => ai,
	calculateJwkThumbprint: () => Pr,
	calculateJwkThumbprintUri: () => Fr,
	compactDecrypt: () => Cn,
	compactVerify: () => Xn,
	createLocalJWKSet: () => Wr,
	createRemoteJWKSet: () => Zr,
	cryptoRuntime: () => Ci,
	decodeJwt: () => di,
	decodeProtectedHeader: () => li,
	errors: () => le,
	experimental_jwksCache: () => ti,
	exportJWK: () => Nn,
	exportPKCS8: () => Mn,
	exportSPKI: () => jn,
	flattenedDecrypt: () => xn,
	flattenedVerify: () => Jn,
	generalDecrypt: () => Tn,
	generalVerify: () => Qn,
	generateKeyPair: () => _i,
	generateSecret: () => yi,
	importJWK: () => Qt,
	importPKCS8: () => Zt,
	importSPKI: () => Yt,
	importX509: () => Xt,
	jwksCache: () => $r,
	jwtDecrypt: () => hr,
	jwtVerify: () => pr
}), Ei = o((() => {
	wn(), Sn(), En(), Vn(), Zn(), Yn(), $n(), mr(), gr(), vr(), Rn(), wr(), Sr(), Dr(), jr(), Nr(), Ir(), Rr(), Kr(), ni(), ii(), Pn(), $t(), ui(), fi(), F(), vi(), bi(), ci(), wi();
})), Di = /* @__PURE__ */ s(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, { verifyVercelOidcToken: () => g }), t.exports = c(l);
	var u = (Ei(), d(Ti)), f = "https://oidc.vercel.com", p = new URL("https://oidc.vercel.com/.well-known/jwks"), m = ["RS256"], h = (0, u.createRemoteJWKSet)(p);
	async function g(e, t) {
		let { algorithms: n, projectId: r = process.env.VERCEL_PROJECT_ID, environment: i = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV, ownerId: a, ...o } = t ?? {};
		if (r === "*" && a === void 0 && !_(o.audience)) throw TypeError("Expected ownerId or audience to be provided when projectId is '*'.");
		let s = await (0, u.jwtVerify)(e, h, {
			...o,
			algorithms: n ?? m
		});
		return v(s.payload.iss), y({
			actual: s.payload.project_id,
			claim: "project_id",
			env: "VERCEL_PROJECT_ID",
			expected: r,
			option: "projectId"
		}), y({
			actual: s.payload.environment,
			claim: "environment",
			env: "VERCEL_TARGET_ENV or VERCEL_ENV",
			expected: i,
			option: "environment"
		}), b({
			actual: s.payload.owner_id,
			claim: "owner_id",
			expected: a
		}), s;
	}
	function _(e) {
		return Array.isArray(e) ? e.length > 0 : e !== void 0;
	}
	function v(e) {
		if (e !== f && (typeof e != "string" || !e.startsWith(`${f}/`))) throw TypeError(`Expected Vercel OIDC token iss claim to be "${f}" or to start with "${f}/".`);
	}
	function y({ actual: e, claim: t, env: n, expected: r, option: i }) {
		if (r !== "*") {
			if (r === void 0 || r.length === 0) throw TypeError(`Expected ${n} to be set or ${i} to be provided. Pass ${i}: '*' to allow any ${t} claim.`);
			if (!(Array.isArray(r) && typeof e == "string" && r.includes(e)) && e !== r) throw TypeError(Array.isArray(r) ? `Expected Vercel OIDC token ${t} claim to be one of: ${r.map((e) => `"${e}"`).join(", ")}.` : `Expected Vercel OIDC token ${t} claim to be "${r}".`);
		}
	}
	function b({ actual: e, claim: t, expected: n }) {
		if (n !== void 0 && e !== n) throw TypeError(`Expected Vercel OIDC token ${t} claim to be "${n}".`);
	}
	0 && (t.exports = { verifyVercelOidcToken: g });
})), Oi = /* @__PURE__ */ s(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, {
		AccessTokenMissingError: () => u,
		RefreshAccessTokenFailedError: () => d
	}), t.exports = c(l);
	var u = class extends Error {
		constructor() {
			super("No authentication found. Please log in with the Vercel CLI (vercel login)."), this.name = "AccessTokenMissingError";
		}
	}, d = class extends Error {
		constructor(e) {
			super("Failed to refresh authentication token."), this.name = "RefreshAccessTokenFailedError", e !== void 0 && (this.cause = e);
		}
	};
	0 && (t.exports = {
		AccessTokenMissingError: u,
		RefreshAccessTokenFailedError: d
	});
})), ki = /* @__PURE__ */ s(((e, t) => {
	var n = Object.defineProperty, r = Object.getOwnPropertyDescriptor, i = Object.getOwnPropertyNames, a = Object.prototype.hasOwnProperty, o = (e, t) => {
		for (var r in t) n(e, r, {
			get: t[r],
			enumerable: !0
		});
	}, s = (e, t, o, s) => {
		if (t && typeof t == "object" || typeof t == "function") for (let c of i(t)) !a.call(e, c) && c !== o && n(e, c, {
			get: () => t[c],
			enumerable: !(s = r(t, c)) || s.enumerable
		});
		return e;
	}, c = (e) => s(n({}, "__esModule", { value: !0 }), e), l = {};
	o(l, {
		AccessTokenMissingError: () => f.AccessTokenMissingError,
		RefreshAccessTokenFailedError: () => f.RefreshAccessTokenFailedError,
		getContext: () => u.getContext,
		getVercelOidcToken: () => p,
		getVercelOidcTokenSync: () => m,
		getVercelToken: () => g,
		verifyVercelOidcToken: () => d.verifyVercelOidcToken
	}), t.exports = c(l);
	var u = h(), d = Di(), f = Oi();
	async function p() {
		return "";
	}
	function m() {
		return "";
	}
	async function g() {
		throw Error("getVercelToken is not supported in browser environments");
	}
	0 && (t.exports = {
		AccessTokenMissingError,
		RefreshAccessTokenFailedError,
		getContext,
		getVercelOidcToken: p,
		getVercelOidcTokenSync: m,
		getVercelToken: g,
		verifyVercelOidcToken
	});
})), Ai = /* @__PURE__ */ s(((e, t) => {
	function n(e, t) {
		typeof t == "boolean" && (t = { forever: t }), this._originalTimeouts = JSON.parse(JSON.stringify(e)), this._timeouts = e, this._options = t || {}, this._maxRetryTime = t && t.maxRetryTime || Infinity, this._fn = null, this._errors = [], this._attempts = 1, this._operationTimeout = null, this._operationTimeoutCb = null, this._timeout = null, this._operationStart = null, this._timer = null, this._options.forever && (this._cachedTimeouts = this._timeouts.slice(0));
	}
	t.exports = n, n.prototype.reset = function() {
		this._attempts = 1, this._timeouts = this._originalTimeouts.slice(0);
	}, n.prototype.stop = function() {
		this._timeout && clearTimeout(this._timeout), this._timer && clearTimeout(this._timer), this._timeouts = [], this._cachedTimeouts = null;
	}, n.prototype.retry = function(e) {
		if (this._timeout && clearTimeout(this._timeout), !e) return !1;
		var t = (/* @__PURE__ */ new Date()).getTime();
		if (e && t - this._operationStart >= this._maxRetryTime) return this._errors.push(e), this._errors.unshift(/* @__PURE__ */ Error("RetryOperation timeout occurred")), !1;
		this._errors.push(e);
		var n = this._timeouts.shift();
		if (n === void 0) {
			if (this._cachedTimeouts) this._errors.splice(0, this._errors.length - 1), n = this._cachedTimeouts.slice(-1);
			else return !1;
		}
		var r = this;
		return this._timer = setTimeout(function() {
			r._attempts++, r._operationTimeoutCb && (r._timeout = setTimeout(function() {
				r._operationTimeoutCb(r._attempts);
			}, r._operationTimeout), r._options.unref && r._timeout.unref()), r._fn(r._attempts);
		}, n), this._options.unref && this._timer.unref(), !0;
	}, n.prototype.attempt = function(e, t) {
		this._fn = e, t && (t.timeout && (this._operationTimeout = t.timeout), t.cb && (this._operationTimeoutCb = t.cb));
		var n = this;
		this._operationTimeoutCb && (this._timeout = setTimeout(function() {
			n._operationTimeoutCb();
		}, n._operationTimeout)), this._operationStart = (/* @__PURE__ */ new Date()).getTime(), this._fn(this._attempts);
	}, n.prototype.try = function(e) {
		console.log("Using RetryOperation.try() is deprecated"), this.attempt(e);
	}, n.prototype.start = function(e) {
		console.log("Using RetryOperation.start() is deprecated"), this.attempt(e);
	}, n.prototype.start = n.prototype.try, n.prototype.errors = function() {
		return this._errors;
	}, n.prototype.attempts = function() {
		return this._attempts;
	}, n.prototype.mainError = function() {
		if (this._errors.length === 0) return null;
		for (var e = {}, t = null, n = 0, r = 0; r < this._errors.length; r++) {
			var i = this._errors[r], a = i.message, o = (e[a] || 0) + 1;
			e[a] = o, o >= n && (t = i, n = o);
		}
		return t;
	};
})), ji = /* @__PURE__ */ s(((e) => {
	var t = Ai();
	e.operation = function(n) {
		return new t(e.timeouts(n), {
			forever: n && (n.forever || n.retries === Infinity),
			unref: n && n.unref,
			maxRetryTime: n && n.maxRetryTime
		});
	}, e.timeouts = function(e) {
		if (e instanceof Array) return [].concat(e);
		var t = {
			retries: 10,
			factor: 2,
			minTimeout: 1e3,
			maxTimeout: Infinity,
			randomize: !1
		};
		for (var n in e) t[n] = e[n];
		if (t.minTimeout > t.maxTimeout) throw Error("minTimeout is greater than maxTimeout");
		for (var r = [], i = 0; i < t.retries; i++) r.push(this.createTimeout(i, t));
		return e && e.forever && !r.length && r.push(this.createTimeout(i, t)), r.sort(function(e, t) {
			return e - t;
		}), r;
	}, e.createTimeout = function(e, t) {
		var n = t.randomize ? Math.random() + 1 : 1, r = Math.round(n * Math.max(t.minTimeout, 1) * t.factor ** +e);
		return r = Math.min(r, t.maxTimeout), r;
	}, e.wrap = function(t, n, r) {
		if (n instanceof Array && (r = n, n = null), !r) for (var i in r = [], t) typeof t[i] == "function" && r.push(i);
		for (var a = 0; a < r.length; a++) {
			var o = r[a], s = t[o];
			t[o] = function(r) {
				var i = e.operation(n), a = Array.prototype.slice.call(arguments, 1), o = a.pop();
				a.push(function(e) {
					i.retry(e) || (e && (arguments[0] = i.mainError()), o.apply(this, arguments));
				}), i.attempt(function() {
					r.apply(t, a);
				});
			}.bind(t, s), t[o].options = n;
		}
	};
})), Mi = /* @__PURE__ */ s(((e, t) => {
	t.exports = ji();
})), Ni = /* @__PURE__ */ s(((e, t) => {
	var n = Mi();
	function r(e, t) {
		function r(r, i) {
			var a = t || {}, o;
			"randomize" in a || (a.randomize = !0), o = n.operation(a);
			function s(e) {
				i(e || /* @__PURE__ */ Error("Aborted"));
			}
			function c(e, t) {
				e.bail ? s(e) : o.retry(e) ? a.onRetry && a.onRetry(e, t) : i(o.mainError());
			}
			function l(t) {
				var n;
				try {
					n = e(s, t);
				} catch (e) {
					c(e, t);
					return;
				}
				Promise.resolve(n).then(r).catch(function(e) {
					c(e, t);
				});
			}
			o.attempt(l);
		}
		return new Promise(r);
	}
	t.exports = r;
})), Pi = ki(), Fi = /* @__PURE__ */ u(Ni(), 1), Ii = globalThis.fetch.bind(globalThis), Li = /* @__PURE__ */ u((/* @__PURE__ */ s(((e, t) => {
	function n(e, t) {
		if (typeof e != "function") throw TypeError(`Expected the first argument to be a \`function\`, got \`${typeof e}\`.`);
		let n, r = 0;
		return function(...i) {
			clearTimeout(n);
			let a = Date.now(), o = t - (a - r);
			o <= 0 ? (r = a, e.apply(this, i)) : n = setTimeout(() => {
				r = Date.now(), e.apply(this, i);
			}, o);
		};
	}
	t.exports = n;
})))(), 1), Ri = new Promise((e) => {
	try {
		let t = new Uint8Array([
			104,
			101,
			108,
			108,
			111
		]);
		new Blob([t]).text().then((t) => {
			e(t === "hello");
		}).catch(() => {
			e(!1);
		});
	} catch {
		e(!1);
	}
});
async function zi(e) {
	if (e instanceof ReadableStream) return e;
	if (e instanceof Blob) return e.stream();
	if (Bi(e)) return m.toWeb(e);
	let t;
	return t = e instanceof ArrayBuffer ? new Uint8Array(e) : Hi(e) ? e : Vi(e), await Ri ? new Blob([t]).stream() : new ReadableStream({ start(e) {
		e.enqueue(t), e.close();
	} });
}
function Bi(e) {
	return typeof e == "object" && typeof e.pipe == "function" && e.readable && typeof e._read == "function" && typeof e._readableState == "object";
}
function Vi(e) {
	return new TextEncoder().encode(e);
}
function Hi(e) {
	return (0, p.default)(e);
}
async function Ui() {
	try {
		let e = (await (0, Pi.getVercelOidcToken)()).trim();
		return e === "" ? void 0 : e;
	} catch {
		return;
	}
}
var Wi = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i, Gi = {
	b: 1,
	kb: 1024,
	mb: 1 << 20,
	gb: 1 << 30,
	tb: 1024 ** 4,
	pb: 1024 ** 5
};
function Z(e) {
	if (typeof e == "number" && !Number.isNaN(e)) return e;
	if (typeof e != "string") return null;
	let t = Wi.exec(e), n, r = "b";
	if (!t) n = parseInt(e, 10);
	else {
		let [, e, , , i] = t;
		if (!e) return null;
		n = parseFloat(e), i && (r = i.toLowerCase());
	}
	return Number.isNaN(n) ? null : Math.floor(Gi[r] * n);
}
var Ki = "https://vercel.com/api/blob";
function qi(e) {
	try {
		let t = process.env[e];
		return typeof t == "string" && t.trim() !== "" ? t.trim() : void 0;
	} catch {
		return;
	}
}
function Ji(e) {
	let [, , , t = ""] = e.split("_");
	return t;
}
function Yi(e) {
	let t = e.replace(/-/g, "+").replace(/_/g, "/"), n = 4 - t.length % 4;
	if (n !== 4 && (t += "=".repeat(n)), typeof atob == "function") return atob(t);
	if (typeof Buffer < "u") return Buffer.from(t, "base64").toString("utf8");
	throw new Q("Cannot decode base64: no atob or Buffer available.");
}
function Xi(e) {
	let t = e.indexOf(".");
	if (t < 0) throw new Q("Invalid delegation token format.");
	let n = e.slice(0, t), r;
	try {
		r = JSON.parse(Yi(n));
	} catch {
		throw new Q("Invalid delegation token payload.");
	}
	if (!r.storeId || typeof r.storeId != "string") throw new Q("Delegation token payload is missing `storeId`.");
	return Zi(r.storeId);
}
function Zi(e) {
	return e.startsWith("store_") ? e.slice(6) : e;
}
async function Qi(e) {
	if (e?.presignedUrlPayload) return {
		kind: "presigned",
		storeId: Xi(e.presignedUrlPayload.delegationToken)
	};
	if (e?.token) {
		let t = Ji(e.token);
		return {
			kind: "readWrite",
			token: e.token,
			storeId: t
		};
	}
	let t = (e?.oidcToken)?.trim(), n = t || await Ui();
	if (n) {
		let r = (e?.storeId)?.trim();
		if (r) return {
			kind: "oidc",
			token: n,
			storeId: Zi(r)
		};
		let i = qi("BLOB_STORE_ID");
		if (i) return {
			kind: "oidc",
			token: n,
			storeId: Zi(i)
		};
		if (t) throw new Q("oidcToken was passed, but no storeId was found. Pass a `storeId` option or set `BLOB_STORE_ID` to use OIDC auth");
	}
	let r = qi("BLOB_READ_WRITE_TOKEN");
	if (r) return {
		kind: "readWrite",
		token: r,
		storeId: Ji(r)
	};
	throw new Q("No blob credentials found. Pass a `token` option, set `BLOB_READ_WRITE_TOKEN`, or use `oidcToken` (or `VERCEL_OIDC_TOKEN`) with `storeId` or `BLOB_STORE_ID`.");
}
var Q = class extends Error {
	constructor(e) {
		super(`Vercel Blob: ${e}`);
	}
};
function $i(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) && !(Symbol.toStringTag in e) && !(Symbol.iterator in e);
}
var ea = ["//"], ta = (() => {
	if (f()) return !0;
	if (ra().startsWith("http://localhost")) return !1;
	let e = !1, t = new Request(ra(), {
		body: new ReadableStream(),
		method: "POST",
		get duplex() {
			return e = !0, "half";
		}
	}).headers.has("Content-Type");
	return e && !t;
})();
function na() {
	try {
		return process.env.VERCEL_BLOB_API_URL || process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL || null;
	} catch {
		return null;
	}
}
function ra(e = "") {
	return `${na() ?? Ki}${e}`;
}
var ia = typeof TextEncoder == "function" ? new TextEncoder() : null;
function aa(e) {
	return e ? typeof e == "string" ? ia ? ia.encode(e).byteLength : new Blob([e]).size : "byteLength" in e && typeof e.byteLength == "number" ? e.byteLength : "size" in e && typeof e.size == "number" ? e.size : 0 : 0;
}
var oa = (e, t) => {
	let n = /* @__PURE__ */ new Uint8Array();
	return new TransformStream({
		transform(r, i) {
			let a = new Uint8Array(n.length + r.byteLength);
			for (a.set(n), a.set(new Uint8Array(r), n.length), n = a; n.length >= e;) {
				let r = n.slice(0, e);
				i.enqueue(r), t?.(r.byteLength), n = n.slice(e);
			}
		},
		flush(e) {
			n.length > 0 && (e.enqueue(n), t?.(n.byteLength));
		}
	});
};
function sa(e) {
	return globalThis.ReadableStream && e instanceof ReadableStream;
}
function ca(e) {
	return !!(sa(e) || Bi(e));
}
var la = (e, t) => {
	let n = new URL(e);
	for (let [e, r] of Object.entries(t.params)) n.searchParams.set(e, r);
	return n.searchParams.set("vercel-blob-delegation", t.delegationToken), n.searchParams.set("vercel-blob-signature", t.signature), n.toString();
}, ua = !1;
try {
	(process.env.DEBUG?.includes("blob") || process.env.NEXT_PUBLIC_DEBUG?.includes("blob")) && (ua = !0);
} catch {}
function $(e, ...t) {
	ua && console.debug(`vercel-blob: ${e}`, ...t);
}
var da = globalThis.DOMException ?? (() => {
	try {
		atob("~");
	} catch (e) {
		return Object.getPrototypeOf(e).constructor;
	}
})(), fa = Object.prototype.toString, pa = (e) => fa.call(e) === "[object Error]", ma = /* @__PURE__ */ new Set([
	"network error",
	"Failed to fetch",
	"NetworkError when attempting to fetch resource.",
	"The Internet connection appears to be offline.",
	"Load failed",
	"Network request failed",
	"fetch failed",
	"terminated"
]);
function ha(e) {
	return e && pa(e) && e.name === "TypeError" && typeof e.message == "string" ? e.message === "Load failed" ? e.stack === void 0 : ma.has(e.message) : !1;
}
var ga = typeof Ii == "function", _a = ga && ta, va = 65536, ya = async ({ input: e, init: t, onUploadProgress: n }) => {
	$("using fetch");
	let r;
	if (t.body) {
		if (n) {
			let e = await zi(t.body), i = 0, a = oa(va, (e) => {
				i += e, n(i);
			});
			r = e.pipeThrough(a);
		} else r = t.body;
	}
	let i = ta && r && ca(r) ? "half" : void 0;
	return Ii(e, {
		...t,
		...t.body ? { body: r } : {},
		duplex: i
	});
}, ba = typeof XMLHttpRequest < "u", xa = async ({ input: e, init: t, onUploadProgress: n }) => {
	$("using xhr");
	let r = null;
	return t.body && (r = sa(t.body) ? await new Response(t.body).blob() : t.body), new Promise((i, a) => {
		let o = new XMLHttpRequest();
		o.open(t.method || "GET", e.toString(), !0), n && o.upload.addEventListener("progress", (e) => {
			e.lengthComputable && n(e.loaded);
		}), o.onload = () => {
			if (t.signal?.aborted) {
				a(new DOMException("The user aborted the request.", "AbortError"));
				return;
			}
			let e = new Headers();
			o.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach((t) => {
				let n = t.split(": "), r = n.shift(), i = n.join(": ");
				r && e.set(r.toLowerCase(), i);
			}), i(new Response(o.response, {
				status: o.status,
				statusText: o.statusText,
				headers: e
			}));
		}, o.onerror = () => {
			a(/* @__PURE__ */ TypeError("Network request failed"));
		}, o.ontimeout = () => {
			a(/* @__PURE__ */ TypeError("Network request timed out"));
		}, o.onabort = () => {
			a(new DOMException("The user aborted a request.", "AbortError"));
		}, t.headers && new Headers(t.headers).forEach((e, t) => {
			o.setRequestHeader(t, e);
		}), t.signal && (t.signal.addEventListener("abort", () => {
			o.abort();
		}), t.signal.aborted) ? o.abort() : o.send(r);
	});
}, Sa = async ({ input: e, init: t, onUploadProgress: n }) => {
	if (n) {
		if (_a) return ya({
			input: e,
			init: t,
			onUploadProgress: n
		});
		if (ba) return xa({
			input: e,
			init: t,
			onUploadProgress: n
		});
	}
	if (ga) return ya({
		input: e,
		init: t
	});
	if (ba) return xa({
		input: e,
		init: t
	});
	throw Error("No request implementation available");
}, Ca = class extends Q {
	constructor() {
		super("Access denied, please provide a valid token for this resource.");
	}
}, wa = class extends Q {
	constructor(e) {
		super(e ?? "OIDC is enabled for this project, but not for this token's environment.");
	}
}, Ta = class extends Q {
	constructor(e) {
		super(`Content type mismatch, ${e}.`);
	}
}, Ea = class extends Q {
	constructor(e) {
		super(`Pathname mismatch, ${e}. Check the pathname used in upload() or put() matches the one from the client token.`);
	}
}, Da = class extends Q {
	constructor() {
		super("Client token has expired.");
	}
}, Oa = class extends Q {
	constructor(e) {
		super(`File is too large, ${e}.`);
	}
}, ka = class extends Q {
	constructor() {
		super("This store does not exist.");
	}
}, Aa = class extends Q {
	constructor() {
		super("This store has been suspended.");
	}
}, ja = class extends Q {
	constructor() {
		super("Unknown error, please visit https://vercel.com/help.");
	}
}, Ma = class extends Q {
	constructor() {
		super("The requested blob does not exist");
	}
}, Na = class extends Q {
	constructor() {
		super("The blob service is currently not available. Please try again.");
	}
}, Pa = class extends Q {
	constructor(e) {
		super(`Too many requests please lower the number of concurrent requests ${e ? ` - try again in ${e} seconds` : ""}.`), this.retryAfter = e ?? 0;
	}
}, Fa = class extends Q {
	constructor() {
		super("The request was aborted.");
	}
}, Ia = class extends Q {
	constructor() {
		super("Precondition failed: ETag mismatch.");
	}
}, La = 13;
function Ra() {
	let e = null;
	try {
		e = process.env.VERCEL_BLOB_API_VERSION_OVERRIDE || process.env.NEXT_PUBLIC_VERCEL_BLOB_API_VERSION_OVERRIDE;
	} catch {}
	return `${e ?? La}`;
}
function za() {
	try {
		let e = process.env.VERCEL_BLOB_RETRIES || "10";
		return parseInt(e, 10);
	} catch {
		return 10;
	}
}
function Ba(e) {
	let t = e.headers.get("retry-after");
	return new Pa(t ? parseInt(t, 10) : void 0);
}
async function Va(e) {
	let t, n;
	try {
		let r = await e.json();
		t = r.error?.code ?? "unknown_error", n = r.error?.message;
	} catch {
		t = "unknown_error";
	}
	n?.includes("contentType") && n.includes("is not allowed") && (t = "content_type_not_allowed"), n?.includes("\"pathname\"") && n.includes("does not match the token payload") && (t = "client_token_pathname_mismatch"), n === "Token expired" && (t = "client_token_expired"), n?.includes("the file length cannot be greater than") && (t = "file_too_large"), n?.startsWith("OIDC is enabled for this project, but not for the") && n.includes("environment.") && (t = "oidc_environment_not_allowed");
	let r;
	switch (t) {
		case "store_suspended":
			r = new Aa();
			break;
		case "forbidden":
			r = new Ca();
			break;
		case "oidc_environment_not_allowed":
			r = new wa(n);
			break;
		case "content_type_not_allowed":
			r = new Ta(n);
			break;
		case "client_token_pathname_mismatch":
			r = new Ea(n);
			break;
		case "client_token_expired":
			r = new Da();
			break;
		case "file_too_large":
			r = new Oa(n);
			break;
		case "not_found":
			r = new Ma();
			break;
		case "client_token_not_allowed":
			r = new Q(n ?? "This operation is not available when using a client token. Use a read–write or OIDC token on the server.");
			break;
		case "store_not_found":
			r = new ka();
			break;
		case "bad_request":
			r = new Q(n ?? "Bad request");
			break;
		case "service_unavailable":
			r = new Na();
			break;
		case "rate_limited":
			r = Ba(e);
			break;
		case "precondition_failed":
			r = new Ia();
			break;
		default: r = new ja();
	}
	return {
		code: t,
		error: r
	};
}
async function Ha(e, t, n) {
	let r = Ra(), i = await Qi(n), a = i.kind === "presigned" ? void 0 : i.token, o = Ua(), s = ra(e);
	n?.presignedUrlPayload && (s = la(s, n.presignedUrlPayload));
	let c = `${i.storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`, l = 0, u = 0, d = 0, f = n?.onUploadProgress || Wa();
	t.body && f && (u = aa(t.body)), n?.onUploadProgress && n.onUploadProgress({
		loaded: 0,
		total: u,
		percentage: 0
	});
	let p = await (0, Fi.default)(async (e) => {
		let p;
		try {
			p = await Sa({
				input: s,
				init: {
					...t,
					headers: {
						"x-api-blob-request-id": c,
						"x-vercel-blob-store-id": i.storeId,
						"x-api-blob-request-attempt": String(l),
						"x-api-version": r,
						...f ? { "x-content-length": String(u) } : {},
						...a === void 0 ? {} : { authorization: `Bearer ${a}` },
						...o,
						...t.headers
					}
				},
				onUploadProgress: n?.onUploadProgress ? (e) => {
					var t;
					let r = u === 0 ? e : u;
					d = e;
					let i = u > 0 ? Number((e / r * 100).toFixed(2)) : 0;
					i === 100 && u > 0 || (t = n.onUploadProgress) == null || t.call(n, {
						loaded: e,
						total: r,
						percentage: i
					});
				} : void 0
			});
		} catch (t) {
			if (t instanceof da && t.name === "AbortError") {
				e(new Fa());
				return;
			}
			if (ha(t)) throw t;
			if (t instanceof TypeError) {
				e(t);
				return;
			}
			throw t;
		}
		if (p.ok) return p;
		let { code: m, error: h } = await Va(p);
		if (m === "unknown_error" || m === "service_unavailable" || m === "internal_server_error") throw h;
		e(h);
	}, {
		retries: za(),
		onRetry: (t) => {
			t instanceof Error && $(`retrying API request to ${e}`, t.message), l += 1;
		}
	});
	if (!p) throw new ja();
	return n?.onUploadProgress && n.onUploadProgress({
		loaded: d,
		total: d,
		percentage: 100
	}), await p.json();
}
function Ua() {
	let e = {};
	try {
		"VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API" in process.env && process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API !== void 0 ? e["x-proxy-through-alternative-api"] = process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API : "NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API" in process.env && process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API !== void 0 && (e["x-proxy-through-alternative-api"] = process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API);
	} catch {}
	return e;
}
function Wa() {
	try {
		return process.env.VERCEL_BLOB_USE_X_CONTENT_LENGTH === "1";
	} catch {
		return !1;
	}
}
var Ga = {
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",
	avif: "image/avif"
};
function Ka(e) {
	if (typeof e != "object" || !e) throw new Q("optimizeImage must be an object, see usage");
	let { width: t, quality: n, format: r } = e;
	if (!Number.isInteger(t) || t < 1 || t > 8192) throw new Q("optimizeImage.width must be an integer between 1 and 8192");
	if (n !== void 0 && (!Number.isInteger(n) || n < 1 || n > 100)) throw new Q("optimizeImage.quality must be an integer between 1 and 100");
	if (r !== void 0 && !(r in Ga)) throw new Q(`optimizeImage.format must be one of: ${Object.keys(Ga).join(", ")}`);
}
function qa(e) {
	if (e && e !== "application/octet-stream" && !e.startsWith("image/")) throw new Q(`optimizeImage requires an image body, but the content type is "${e}"`);
}
function Ja(e, t) {
	Ka(t), e.set("width", String(t.width)), e.set("quality", String(t.quality ?? 75)), t.format && e.set("format", Ga[t.format]);
}
var Ya = {
	cacheControlMaxAge: "x-cache-control-max-age",
	addRandomSuffix: "x-add-random-suffix",
	allowOverwrite: "x-allow-overwrite",
	contentType: "x-content-type",
	access: "x-vercel-blob-access",
	ifMatch: "x-if-match"
};
function Xa(e, t) {
	let n = {};
	if (n[Ya.access] = t.access, e.includes("contentType") && t.contentType && (n[Ya.contentType] = t.contentType), e.includes("addRandomSuffix") && t.addRandomSuffix !== void 0 && (n[Ya.addRandomSuffix] = t.addRandomSuffix ? "1" : "0"), e.includes("ifMatch") && t.ifMatch) {
		if (t.allowOverwrite === !1) throw new Q("ifMatch and allowOverwrite: false are contradictory. ifMatch is used for conditional overwrites, which requires allowOverwrite to be true.");
		n[Ya.ifMatch] = t.ifMatch, e.includes("allowOverwrite") && t.allowOverwrite === void 0 && (n[Ya.allowOverwrite] = "1");
	}
	return e.includes("allowOverwrite") && t.allowOverwrite !== void 0 && (n[Ya.allowOverwrite] = t.allowOverwrite ? "1" : "0"), e.includes("cacheControlMaxAge") && t.cacheControlMaxAge !== void 0 && (n[Ya.cacheControlMaxAge] = t.cacheControlMaxAge.toString()), n;
}
async function Za({ pathname: e, options: t, extraChecks: n, getToken: r }) {
	if (!e) throw new Q("pathname is required");
	if (e.length > 950) throw new Q("pathname is too long, maximum length is 950");
	for (let t of ea) if (e.includes(t)) throw new Q(`pathname cannot contain "${t}", please encode it if needed`);
	if (!t) throw new Q("missing options, see usage");
	if (t.access !== "public" && t.access !== "private") throw new Q("access must be \"private\" or \"public\", see https://vercel.com/docs/vercel-blob");
	return n && n(t), r && (t.token = await r(e, t)), t;
}
function Qa({ allowedOptions: e, getToken: t, extraChecks: n }) {
	return async (r, i, a) => {
		let o = await Za({
			pathname: r,
			options: a,
			extraChecks: n,
			getToken: t
		}), s = Xa(e, o);
		return $a({
			uploadId: o.uploadId,
			key: o.key,
			pathname: r,
			headers: s,
			options: o,
			parts: i
		});
	};
}
async function $a({ uploadId: e, key: t, pathname: n, parts: r, headers: i, options: a }) {
	let o = new URLSearchParams({ pathname: n });
	try {
		let n = await Ha(`/mpu?${o.toString()}`, {
			method: "POST",
			headers: {
				...i,
				"content-type": "application/json",
				"x-mpu-action": "complete",
				"x-mpu-upload-id": e,
				"x-mpu-key": encodeURIComponent(t)
			},
			body: JSON.stringify(r),
			signal: a.abortSignal
		}, a);
		return $("mpu: complete", n), n;
	} catch (e) {
		throw e instanceof TypeError && (e.message === "Failed to fetch" || e.message === "fetch failed") ? new Na() : e;
	}
}
function eo({ allowedOptions: e, getToken: t, extraChecks: n }) {
	return async (r, i) => {
		let a = await Za({
			pathname: r,
			options: i,
			extraChecks: n,
			getToken: t
		}), o = await to(r, Xa(e, a), a);
		return {
			key: o.key,
			uploadId: o.uploadId
		};
	};
}
async function to(e, t, n) {
	$("mpu: create", "pathname:", e);
	let r = new URLSearchParams({ pathname: e });
	try {
		let e = await Ha(`/mpu?${r.toString()}`, {
			method: "POST",
			headers: {
				...t,
				"x-mpu-action": "create"
			},
			signal: n.abortSignal
		}, n);
		return $("mpu: create", e), e;
	} catch (e) {
		throw e instanceof TypeError && (e.message === "Failed to fetch" || e.message === "fetch failed") ? new Na() : e;
	}
}
function no({ allowedOptions: e, getToken: t, extraChecks: n }) {
	return async (r, i, a) => {
		let o = await Za({
			pathname: r,
			options: a,
			extraChecks: n,
			getToken: t
		}), s = Xa(e, o);
		if ($i(i)) throw new Q("Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.");
		return {
			etag: (await ro({
				uploadId: o.uploadId,
				key: o.key,
				pathname: r,
				part: {
					blob: i,
					partNumber: o.partNumber
				},
				headers: s,
				options: o
			})).etag,
			partNumber: o.partNumber
		};
	};
}
async function ro({ uploadId: e, key: t, pathname: n, headers: r, options: i, internalAbortController: a = new AbortController(), part: o }) {
	var s, c;
	let l = Ha(`/mpu?${new URLSearchParams({ pathname: n }).toString()}`, {
		signal: a.signal,
		method: "POST",
		headers: {
			...r,
			"x-mpu-action": "upload",
			"x-mpu-key": encodeURIComponent(t),
			"x-mpu-upload-id": e,
			"x-mpu-part-number": o.partNumber.toString()
		},
		body: o.blob
	}, i);
	function u() {
		a.abort();
	}
	i.abortSignal?.aborted ? u() : (s = i.abortSignal) == null || s.addEventListener("abort", u);
	let d = await l;
	return (c = i.abortSignal) == null || c.removeEventListener("abort", u), d;
}
var io = typeof window < "u" ? 6 : 8, ao = 8388608, oo = io * ao * 2;
function so({ uploadId: e, key: t, pathname: n, stream: r, headers: i, options: a, totalToLoad: o }) {
	$("mpu: upload init", "key:", t);
	let s = new AbortController();
	return new Promise((c, l) => {
		let u = [], d = [], f = r.getReader(), p = 0, m = !1, h = 1, g = !1, _ = 0, v = !1, y = 0, b = [], x = 0, ee, te = {};
		a.onUploadProgress && (ee = (0, Li.default)(() => {
			var e;
			let t = Object.values(te).reduce((e, t) => e + t, 0), n = o || t, r = o > 0 ? Number(((t / o || t) * 100).toFixed(2)) : 0;
			(e = a.onUploadProgress) == null || e.call(a, {
				loaded: t,
				total: n,
				percentage: r
			});
		}, 150)), ne().catch(ae);
		async function ne() {
			for ($("mpu: upload read start", "activeUploads:", p, "currentBytesInMemory:", `${Z(_)}/${Z(oo)}`, "bytesSent:", Z(y)), m = !0; _ < oo && !g;) try {
				let { value: e, done: t } = await f.read();
				if (t) {
					v = !0, $("mpu: upload read consumed the whole stream"), b.length > 0 ? (u.push({
						partNumber: h++,
						blob: new Blob(b, { type: "application/octet-stream" })
					}), ie()) : p === 0 && (f.releaseLock(), c(d)), m = !1;
					return;
				}
				_ += e.byteLength;
				let n = 0;
				for (; n < e.byteLength;) {
					let t = ao - x, r = Math.min(n + t, e.byteLength), i = e.slice(n, r);
					b.push(i), x += i.byteLength, n = r, x === ao && (u.push({
						partNumber: h++,
						blob: new Blob(b, { type: "application/octet-stream" })
					}), b = [], x = 0, ie());
				}
			} catch (e) {
				ae(e);
			}
			$("mpu: upload read end", "activeUploads:", p, "currentBytesInMemory:", `${Z(_)}/${Z(oo)}`, "bytesSent:", Z(y)), m = !1;
		}
		async function re(r) {
			p++, $("mpu: upload send part start", "partNumber:", r.partNumber, "size:", r.blob.size, "activeUploads:", p, "currentBytesInMemory:", `${Z(_)}/${Z(oo)}`, "bytesSent:", Z(y));
			try {
				let o = a.onUploadProgress ? (e) => {
					te[r.partNumber] = e.loaded, ee && ee();
				} : void 0, l = await ro({
					uploadId: e,
					key: t,
					pathname: n,
					headers: i,
					options: {
						...a,
						onUploadProgress: o
					},
					internalAbortController: s,
					part: r
				});
				if ($("mpu: upload send part end", "partNumber:", r.partNumber, "activeUploads", p, "currentBytesInMemory:", `${Z(_)}/${Z(oo)}`, "bytesSent:", Z(y)), g) return;
				if (d.push({
					partNumber: r.partNumber,
					etag: l.etag
				}), _ -= r.blob.size, p--, y += r.blob.size, u.length > 0 && ie(), v) {
					p === 0 && (f.releaseLock(), c(d));
					return;
				}
				m || ne().catch(ae);
			} catch (e) {
				ae(e);
			}
		}
		function ie() {
			if (!g) for ($("send parts", "activeUploads", p, "partsToUpload", u.length); p < io && u.length > 0;) {
				let e = u.shift();
				e && re(e);
			}
		}
		function ae(e) {
			g || (g = !0, s.abort(), f.releaseLock(), e instanceof TypeError && (e.message === "Failed to fetch" || e.message === "fetch failed") ? l(new Na()) : l(e));
		}
	});
}
function co({ allowedOptions: e, getToken: t, extraChecks: n }) {
	return async (r, i) => {
		let a = await Za({
			pathname: r,
			options: i,
			extraChecks: n,
			getToken: t
		}), o = Xa(e, a), s = await to(r, o, a);
		return {
			key: s.key,
			uploadId: s.uploadId,
			async uploadPart(e, t) {
				if ($i(t)) throw new Q("Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.");
				return {
					etag: (await ro({
						uploadId: s.uploadId,
						key: s.key,
						pathname: r,
						part: {
							partNumber: e,
							blob: t
						},
						headers: o,
						options: a
					})).etag,
					partNumber: e
				};
			},
			async complete(e) {
				return $a({
					uploadId: s.uploadId,
					key: s.key,
					pathname: r,
					parts: e,
					headers: o,
					options: a
				});
			}
		};
	};
}
async function lo(e, t, n, r) {
	$("mpu: init", "pathname:", e, "headers:", n);
	let i = {
		...r,
		onUploadProgress: void 0
	};
	if (r.maximumSizeInBytes !== void 0 && !ca(t) && aa(t) > r.maximumSizeInBytes) throw new Q(`Body size of ${aa(t)} bytes exceeds the maximum allowed size of ${r.maximumSizeInBytes} bytes`);
	let a = await to(e, n, i), o = aa(t), s = await zi(t), c = await so({
		uploadId: a.uploadId,
		key: a.key,
		pathname: e,
		stream: s,
		headers: n,
		options: r,
		totalToLoad: o
	});
	return await $a({
		uploadId: a.uploadId,
		key: a.key,
		pathname: e,
		parts: c,
		headers: n,
		options: i
	});
}
function uo({ allowedOptions: e, getToken: t, getPresignedUrlPayload: n, extraChecks: r }) {
	return async function(i, a, o) {
		if (!a) throw new Q("body is required");
		if ($i(a)) throw new Q("Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.");
		let s = await Za({
			pathname: i,
			options: o,
			extraChecks: r,
			getToken: t
		}), c = await n?.(i, s), l = {
			...s,
			presignedUrlPayload: c
		}, u = Xa(e, s);
		if (s.optimizeImage) {
			if (s.multipart === !0) throw new Q("optimizeImage cannot be combined with multipart uploads");
			qa(s.contentType ?? (typeof Blob < "u" && a instanceof Blob ? a.type : void 0));
			let e = new URLSearchParams({ pathname: i });
			Ja(e, s.optimizeImage);
			let t = await Ha(`/put-optimized?${e.toString()}`, {
				method: "POST",
				body: a,
				headers: u,
				signal: s.abortSignal
			}, l);
			return {
				url: t.url,
				downloadUrl: t.downloadUrl,
				pathname: t.pathname,
				contentType: t.contentType,
				contentDisposition: t.contentDisposition,
				etag: t.etag
			};
		}
		if (s.multipart === !0) return lo(i, a, u, l);
		let d = s.onUploadProgress ? (0, Li.default)(s.onUploadProgress, 100) : void 0, f = await Ha(`/?${new URLSearchParams({ pathname: i }).toString()}`, {
			method: "PUT",
			body: a,
			headers: u,
			signal: s.abortSignal
		}, {
			...l,
			onUploadProgress: d
		});
		return {
			url: f.url,
			downloadUrl: f.downloadUrl,
			pathname: f.pathname,
			contentType: f.contentType,
			contentDisposition: f.contentDisposition,
			etag: f.etag
		};
	};
}
new TextEncoder();
//#endregion
//#region node_modules/@vercel/blob/dist/client.js
function fo(e) {
	return function(t) {
		if (!t.token.startsWith("vercel_blob_client_")) throw new Q(`${e} must be called with a client token`);
		if (t.addRandomSuffix !== void 0 || t.allowOverwrite !== void 0 || t.cacheControlMaxAge !== void 0) throw new Q(`${e} doesn't allow \`addRandomSuffix\`, \`cacheControlMaxAge\` or \`allowOverwrite\`. Configure these options at the server side when generating client tokens.`);
	};
}
uo({
	allowedOptions: ["contentType"],
	extraChecks: fo("client/`put`")
}), eo({
	allowedOptions: ["contentType"],
	extraChecks: fo("client/`createMultipartUpload`")
}), co({
	allowedOptions: ["contentType"],
	extraChecks: fo("client/`createMultipartUpload`")
}), no({
	allowedOptions: ["contentType"],
	extraChecks: fo("client/`multipartUpload`")
}), Qa({
	allowedOptions: ["contentType"],
	extraChecks: fo("client/`completeMultipartUpload`")
});
var po = uo({
	allowedOptions: ["contentType"],
	extraChecks(e) {
		if (e.handleUploadUrl === void 0) throw new Q("client/`upload` requires the 'handleUploadUrl' parameter");
		if (e.addRandomSuffix !== void 0 || e.allowOverwrite !== void 0 || e.cacheControlMaxAge !== void 0 || e.ifMatch !== void 0) throw new Q("client/`upload` doesn't allow `addRandomSuffix`, `cacheControlMaxAge`, `allowOverwrite` or `ifMatch`. Configure these options at the server side when generating client tokens.");
	},
	async getToken(e, t) {
		return ho({
			handleUploadUrl: t.handleUploadUrl,
			pathname: e,
			clientPayload: t.clientPayload ?? null,
			multipart: t.multipart ?? !1,
			headers: t.headers
		});
	}
});
uo({
	allowedOptions: ["contentType"],
	extraChecks(e) {
		if (e.handleUploadUrl === void 0) throw new Q("client/`upload` requires the 'handleUploadUrl' parameter");
		if (e.addRandomSuffix !== void 0 || e.allowOverwrite !== void 0 || e.cacheControlMaxAge !== void 0 || e.ifMatch !== void 0) throw new Q("client/`uploadPresigned` doesn't allow `addRandomSuffix`, `cacheControlMaxAge`, `allowOverwrite` or `ifMatch`. Configure these options at the server side when generating presigned URLs.");
	},
	async getPresignedUrlPayload(e, t) {
		return go({
			pathname: e,
			handleUploadUrl: t.handleUploadUrl,
			clientPayload: t.clientPayload ?? null,
			multipart: t.multipart ?? !1,
			headers: t.headers
		});
	}
});
var mo = {
	generateClientToken: "blob.generate-client-token",
	generatePresignedUrl: "blob.generate-presigned-url",
	uploadCompleted: "blob.upload-completed"
};
async function ho(e) {
	let { handleUploadUrl: t, pathname: n } = e, r = vo(t) ? t : _o(t), i = {
		type: mo.generateClientToken,
		payload: {
			pathname: n,
			clientPayload: e.clientPayload,
			multipart: e.multipart
		}
	}, a = await Ii(r, {
		method: "POST",
		body: JSON.stringify(i),
		headers: {
			"content-type": "application/json",
			...e.headers
		},
		signal: e.abortSignal
	});
	if (!a.ok) throw new Q("Failed to  retrieve the client token");
	try {
		let { clientToken: e } = await a.json();
		return e;
	} catch {
		throw new Q("Failed to retrieve the client token");
	}
}
async function go(e) {
	let { handleUploadUrl: t, pathname: n } = e, r = vo(t) ? t : _o(t), i = {
		type: mo.generatePresignedUrl,
		payload: {
			pathname: n,
			clientPayload: e.clientPayload,
			multipart: e.multipart
		}
	}, a = await Ii(r, {
		method: "POST",
		body: JSON.stringify(i),
		headers: {
			"content-type": "application/json",
			...e.headers
		},
		signal: e.abortSignal
	});
	if (!a.ok) throw new Q("Failed to retrieve the presigned URL");
	try {
		let { presignedUrlPayload: e } = await a.json();
		if (e) return e;
		throw new Q("Missing presignedUrlPayload");
	} catch (e) {
		throw e instanceof Q ? e : new Q("Failed to retrieve the presigned URL");
	}
}
function _o(e) {
	return new URL(e, location.href).href;
}
function vo(e) {
	try {
		return !!new URL(e);
	} catch {
		return !1;
	}
}
//#endregion
//#region public/realtime-client.js
function yo(e, t, n) {
	let r = !1, i = !1, a = "0", o;
	async function s() {
		if (r) return;
		let e = 2e3;
		try {
			let r = await fetch(`/api/sync-events?after=${encodeURIComponent(a)}`, { cache: "no-store" }), o = await r.json();
			if (!r.ok) throw Error(o?.error || "Unable to load live updates.");
			if (!Array.isArray(o.events) || typeof o.lastEventId != "string") throw Error("The live update response was invalid.");
			if (!i) a = o.lastEventId, i = o.events.length === 0, i ? n("SUBSCRIBED") : e = 0;
			else {
				for (let e of o.events) {
					if (typeof e.id != "string" || typeof e.event != "string") throw Error("The live update response contained an invalid event.");
					a = e.id, t(e.event);
				}
				o.events.length === 100 && (e = 0), n("SUBSCRIBED");
			}
		} catch (t) {
			n("CHANNEL_ERROR"), console.error("Unable to poll cloud live updates:", t), e = 5e3;
		}
		r || (o = setTimeout(s, e));
	}
	return s(), () => {
		r = !0, clearTimeout(o);
	};
}
async function bo(e, t) {
	return po(e.storagePath, t, {
		access: "private",
		handleUploadUrl: e.uploadTokenUrl,
		clientPayload: JSON.stringify({ ticketId: e.ticketId }),
		contentType: t.type,
		multipart: t.size > 4194304
	});
}
//#endregion
export { yo as subscribeToChanges, bo as uploadWorkFile };
