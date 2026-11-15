class Singer extends AudioWorkletProcessor {
  constructor(o){
    super(); const p = o.processorOptions || {};
    this.lf = Math.log(p.f0 || 130); this.tlf = this.lf; this.k = 0;
    this.ph = 0.6 + Math.random() * 0.4; this.prev = 0; this.cf = 1; this.ca = 1;
    this.jit = p.jit || 0.004; this.shim = p.shim || 0.04; this.asp = 0.05;
    this.d = 0; this.dAmt = p.drift || 4; this.vA = p.vib || 0;
    this.vR = 4.4 + Math.random() * 1.3; this.vP = Math.random() * 6.28;
    this.off = p.off || 0; this.n1 = 0; this.alive = true;
    this.port.onmessage = e => { const m = e.data;
      if (m.stop) this.alive = false;
      if (m.f0){ this.tlf = Math.log(m.f0); this.k = 1 - Math.exp(-3 / (Math.max(0.004, m.glide || 0.08) * sampleRate)); }
      if (m.drift != null) this.dAmt = m.drift;
      if (m.vib != null) this.vA = m.vib;
      if (m.jit != null) this.jit = m.jit;
      if (m.shim != null) this.shim = m.shim;
    };
  }
  rn(){ let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * Math.random()); }
  process(_, outs){
    const o = outs[0][0], sr = sampleRate, n = o.length, dt = n / sr, th = 0.7;
    this.d += -this.d * th * dt + this.dAmt * Math.sqrt(2 * th * dt) * this.rn();
    const vInc = 6.2831853 * this.vR / sr;
    for (let i = 0; i < n; i++){
      this.lf += (this.tlf - this.lf) * this.k;
      this.vP += vInc;
      const cents = this.d + this.off + this.vA * Math.sin(this.vP);
      const f = Math.exp(this.lf + cents * 0.00057762) * this.cf;
      const inc = f / sr; this.ph += inc;
      if (this.ph >= 1){ this.ph -= 1; this.cf = 1 + this.jit * this.rn(); this.ca = Math.max(0.6, 1 + this.shim * this.rn()); }
      const p = this.ph; let g;
      if (p < 0.42) g = 0.5 * (1 - Math.cos(7.47998 * p));
      else if (p < 0.6) g = Math.cos(8.72665 * (p - 0.42));
      else g = 0;
      const dg = (g - this.prev) / inc / 8; this.prev = g;
      const w = Math.random() * 2 - 1; this.n1 += 0.35 * (w - this.n1);
      o[i] = this.ca * dg + this.asp * (w - this.n1) * (0.3 + g);
    }
    return this.alive;
  }
}
registerProcessor("singer", Singer);