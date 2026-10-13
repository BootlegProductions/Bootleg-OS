var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/gifenc/dist/gifenc.js
var require_gifenc = __commonJS({
  "node_modules/gifenc/dist/gifenc.js"(exports) {
    var __defProp2 = Object.defineProperty;
    var __markAsModule = (target) => __defProp2(target, "__esModule", { value: true });
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    __markAsModule(exports);
    __export(exports, {
      GIFEncoder: () => GIFEncoder2,
      applyPalette: () => applyPalette,
      default: () => src_default,
      nearestColor: () => nearestColor,
      nearestColorIndex: () => nearestColorIndex,
      nearestColorIndexWithDistance: () => nearestColorIndexWithDistance,
      prequantize: () => prequantize,
      quantize: () => quantize,
      snapColorsToPalette: () => snapColorsToPalette
    });
    var constants_default = {
      signature: "GIF",
      version: "89a",
      trailer: 59,
      extensionIntroducer: 33,
      applicationExtensionLabel: 255,
      graphicControlExtensionLabel: 249,
      imageSeparator: 44,
      signatureSize: 3,
      versionSize: 3,
      globalColorTableFlagMask: 128,
      colorResolutionMask: 112,
      sortFlagMask: 8,
      globalColorTableSizeMask: 7,
      applicationIdentifierSize: 8,
      applicationAuthCodeSize: 3,
      disposalMethodMask: 28,
      userInputFlagMask: 2,
      transparentColorFlagMask: 1,
      localColorTableFlagMask: 128,
      interlaceFlagMask: 64,
      idSortFlagMask: 32,
      localColorTableSizeMask: 7
    };
    function createStream(initialCapacity = 256) {
      let cursor = 0;
      let contents = new Uint8Array(initialCapacity);
      return {
        get buffer() {
          return contents.buffer;
        },
        reset() {
          cursor = 0;
        },
        bytesView() {
          return contents.subarray(0, cursor);
        },
        bytes() {
          return contents.slice(0, cursor);
        },
        writeByte(byte) {
          expand(cursor + 1);
          contents[cursor] = byte;
          cursor++;
        },
        writeBytes(data, offset = 0, byteLength = data.length) {
          expand(cursor + byteLength);
          for (let i = 0; i < byteLength; i++) {
            contents[cursor++] = data[i + offset];
          }
        },
        writeBytesView(data, offset = 0, byteLength = data.byteLength) {
          expand(cursor + byteLength);
          contents.set(data.subarray(offset, offset + byteLength), cursor);
          cursor += byteLength;
        }
      };
      function expand(newCapacity) {
        var prevCapacity = contents.length;
        if (prevCapacity >= newCapacity)
          return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0)
          newCapacity = Math.max(newCapacity, 256);
        const oldContents = contents;
        contents = new Uint8Array(newCapacity);
        if (cursor > 0)
          contents.set(oldContents.subarray(0, cursor), 0);
      }
    }
    var BITS = 12;
    var DEFAULT_HSIZE = 5003;
    var MASKS = [
      0,
      1,
      3,
      7,
      15,
      31,
      63,
      127,
      255,
      511,
      1023,
      2047,
      4095,
      8191,
      16383,
      32767,
      65535
    ];
    function lzwEncode(width, height, pixels, colorDepth, outStream = createStream(512), accum = new Uint8Array(256), htab = new Int32Array(DEFAULT_HSIZE), codetab = new Int32Array(DEFAULT_HSIZE)) {
      const hsize = htab.length;
      const initCodeSize = Math.max(2, colorDepth);
      accum.fill(0);
      codetab.fill(0);
      htab.fill(-1);
      let cur_accum = 0;
      let cur_bits = 0;
      const init_bits = initCodeSize + 1;
      const g_init_bits = init_bits;
      let clear_flg = false;
      let n_bits = g_init_bits;
      let maxcode = (1 << n_bits) - 1;
      const ClearCode = 1 << init_bits - 1;
      const EOFCode = ClearCode + 1;
      let free_ent = ClearCode + 2;
      let a_count = 0;
      let ent = pixels[0];
      let hshift = 0;
      for (let fcode = hsize; fcode < 65536; fcode *= 2) {
        ++hshift;
      }
      hshift = 8 - hshift;
      outStream.writeByte(initCodeSize);
      output(ClearCode);
      const length = pixels.length;
      for (let idx = 1; idx < length; idx++) {
        next_block: {
          const c = pixels[idx];
          const fcode = (c << BITS) + ent;
          let i = c << hshift ^ ent;
          if (htab[i] === fcode) {
            ent = codetab[i];
            break next_block;
          }
          const disp = i === 0 ? 1 : hsize - i;
          while (htab[i] >= 0) {
            i -= disp;
            if (i < 0)
              i += hsize;
            if (htab[i] === fcode) {
              ent = codetab[i];
              break next_block;
            }
          }
          output(ent);
          ent = c;
          if (free_ent < 1 << BITS) {
            codetab[i] = free_ent++;
            htab[i] = fcode;
          } else {
            htab.fill(-1);
            free_ent = ClearCode + 2;
            clear_flg = true;
            output(ClearCode);
          }
        }
      }
      output(ent);
      output(EOFCode);
      outStream.writeByte(0);
      return outStream.bytesView();
      function output(code) {
        cur_accum &= MASKS[cur_bits];
        if (cur_bits > 0)
          cur_accum |= code << cur_bits;
        else
          cur_accum = code;
        cur_bits += n_bits;
        while (cur_bits >= 8) {
          accum[a_count++] = cur_accum & 255;
          if (a_count >= 254) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
          cur_accum >>= 8;
          cur_bits -= 8;
        }
        if (free_ent > maxcode || clear_flg) {
          if (clear_flg) {
            n_bits = g_init_bits;
            maxcode = (1 << n_bits) - 1;
            clear_flg = false;
          } else {
            ++n_bits;
            maxcode = n_bits === BITS ? 1 << n_bits : (1 << n_bits) - 1;
          }
        }
        if (code == EOFCode) {
          while (cur_bits > 0) {
            accum[a_count++] = cur_accum & 255;
            if (a_count >= 254) {
              outStream.writeByte(a_count);
              outStream.writeBytesView(accum, 0, a_count);
              a_count = 0;
            }
            cur_accum >>= 8;
            cur_bits -= 8;
          }
          if (a_count > 0) {
            outStream.writeByte(a_count);
            outStream.writeBytesView(accum, 0, a_count);
            a_count = 0;
          }
        }
      }
    }
    var lzwEncode_default = lzwEncode;
    function rgb888_to_rgb565(r, g, b) {
      return r << 8 & 63488 | g << 2 & 992 | b >> 3;
    }
    function rgba8888_to_rgba4444(r, g, b, a) {
      return r >> 4 | g & 240 | (b & 240) << 4 | (a & 240) << 8;
    }
    function rgb888_to_rgb444(r, g, b) {
      return r >> 4 << 8 | g & 240 | b >> 4;
    }
    function clamp(value, min, max) {
      return value < min ? min : value > max ? max : value;
    }
    function sqr(value) {
      return value * value;
    }
    function find_nn(bins, idx, hasAlpha) {
      var nn = 0;
      var err = 1e100;
      const bin1 = bins[idx];
      const n1 = bin1.cnt;
      const wa = bin1.ac;
      const wr = bin1.rc;
      const wg = bin1.gc;
      const wb = bin1.bc;
      for (var i = bin1.fw; i != 0; i = bins[i].fw) {
        const bin = bins[i];
        const n2 = bin.cnt;
        const nerr2 = n1 * n2 / (n1 + n2);
        if (nerr2 >= err)
          continue;
        var nerr = 0;
        if (hasAlpha) {
          nerr += nerr2 * sqr(bin.ac - wa);
          if (nerr >= err)
            continue;
        }
        nerr += nerr2 * sqr(bin.rc - wr);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.gc - wg);
        if (nerr >= err)
          continue;
        nerr += nerr2 * sqr(bin.bc - wb);
        if (nerr >= err)
          continue;
        err = nerr;
        nn = i;
      }
      bin1.err = err;
      bin1.nn = nn;
    }
    function create_bin() {
      return {
        ac: 0,
        rc: 0,
        gc: 0,
        bc: 0,
        cnt: 0,
        nn: 0,
        fw: 0,
        bk: 0,
        tm: 0,
        mtm: 0,
        err: 0
      };
    }
    function create_bin_list(data, format) {
      const bincount = format === "rgb444" ? 4096 : 65536;
      const bins = new Array(bincount);
      const size = data.length;
      if (format === "rgba4444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgba8888_to_rgba4444(r, g, b, a);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.ac += a;
          bin.cnt++;
        }
      } else if (format === "rgb444") {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb444(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      } else {
        for (let i = 0; i < size; ++i) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const index = rgb888_to_rgb565(r, g, b);
          let bin = index in bins ? bins[index] : bins[index] = create_bin();
          bin.rc += r;
          bin.gc += g;
          bin.bc += b;
          bin.cnt++;
        }
      }
      return bins;
    }
    function quantize(rgba, maxColors, opts = {}) {
      const {
        format = "rgb565",
        clearAlpha = true,
        clearAlphaColor = 0,
        clearAlphaThreshold = 0,
        oneBitAlpha = false
      } = opts;
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      const data = new Uint32Array(rgba.buffer);
      let useSqrt = opts.useSqrt !== false;
      const hasAlpha = format === "rgba4444";
      const bins = create_bin_list(data, format);
      const bincount = bins.length;
      const bincountMinusOne = bincount - 1;
      const heap = new Uint32Array(bincount + 1);
      var maxbins = 0;
      for (var i = 0; i < bincount; ++i) {
        const bin = bins[i];
        if (bin != null) {
          var d = 1 / bin.cnt;
          if (hasAlpha)
            bin.ac *= d;
          bin.rc *= d;
          bin.gc *= d;
          bin.bc *= d;
          bins[maxbins++] = bin;
        }
      }
      if (sqr(maxColors) / maxbins < 0.022) {
        useSqrt = false;
      }
      var i = 0;
      for (; i < maxbins - 1; ++i) {
        bins[i].fw = i + 1;
        bins[i + 1].bk = i;
        if (useSqrt)
          bins[i].cnt = Math.sqrt(bins[i].cnt);
      }
      if (useSqrt)
        bins[i].cnt = Math.sqrt(bins[i].cnt);
      var h, l, l2;
      for (i = 0; i < maxbins; ++i) {
        find_nn(bins, i, false);
        var err = bins[i].err;
        for (l = ++heap[0]; l > 1; l = l2) {
          l2 = l >> 1;
          if (bins[h = heap[l2]].err <= err)
            break;
          heap[l] = h;
        }
        heap[l] = i;
      }
      var extbins = maxbins - maxColors;
      for (i = 0; i < extbins; ) {
        var tb;
        for (; ; ) {
          var b1 = heap[1];
          tb = bins[b1];
          if (tb.tm >= tb.mtm && bins[tb.nn].mtm <= tb.tm)
            break;
          if (tb.mtm == bincountMinusOne)
            b1 = heap[1] = heap[heap[0]--];
          else {
            find_nn(bins, b1, false);
            tb.tm = i;
          }
          var err = bins[b1].err;
          for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
            if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
              l2++;
            if (err <= bins[h = heap[l2]].err)
              break;
            heap[l] = h;
          }
          heap[l] = b1;
        }
        var nb = bins[tb.nn];
        var n1 = tb.cnt;
        var n2 = nb.cnt;
        var d = 1 / (n1 + n2);
        if (hasAlpha)
          tb.ac = d * (n1 * tb.ac + n2 * nb.ac);
        tb.rc = d * (n1 * tb.rc + n2 * nb.rc);
        tb.gc = d * (n1 * tb.gc + n2 * nb.gc);
        tb.bc = d * (n1 * tb.bc + n2 * nb.bc);
        tb.cnt += nb.cnt;
        tb.mtm = ++i;
        bins[nb.bk].fw = nb.fw;
        bins[nb.fw].bk = nb.bk;
        nb.mtm = bincountMinusOne;
      }
      let palette = [];
      var k = 0;
      for (i = 0; ; ++k) {
        let r = clamp(Math.round(bins[i].rc), 0, 255);
        let g = clamp(Math.round(bins[i].gc), 0, 255);
        let b = clamp(Math.round(bins[i].bc), 0, 255);
        let a = 255;
        if (hasAlpha) {
          a = clamp(Math.round(bins[i].ac), 0, 255);
          if (oneBitAlpha) {
            const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
            a = a <= threshold ? 0 : 255;
          }
          if (clearAlpha && a <= clearAlphaThreshold) {
            r = g = b = clearAlphaColor;
            a = 0;
          }
        }
        const color = hasAlpha ? [r, g, b, a] : [r, g, b];
        const exists = existsInPalette(palette, color);
        if (!exists)
          palette.push(color);
        if ((i = bins[i].fw) == 0)
          break;
      }
      return palette;
    }
    function existsInPalette(palette, color) {
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i];
        let matchesRGB = p[0] === color[0] && p[1] === color[1] && p[2] === color[2];
        let matchesAlpha = p.length >= 4 && color.length >= 4 ? p[3] === color[3] : true;
        if (matchesRGB && matchesAlpha)
          return true;
      }
      return false;
    }
    function euclideanDistanceSquared(a, b) {
      var sum = 0;
      var n;
      for (n = 0; n < a.length; n++) {
        const dx = a[n] - b[n];
        sum += dx * dx;
      }
      return sum;
    }
    function roundStep(byte, step) {
      return step > 1 ? Math.round(byte / step) * step : byte;
    }
    function prequantize(rgba, { roundRGB = 5, roundAlpha = 10, oneBitAlpha = null } = {}) {
      const data = new Uint32Array(rgba.buffer);
      for (let i = 0; i < data.length; i++) {
        const color = data[i];
        let a = color >> 24 & 255;
        let b = color >> 16 & 255;
        let g = color >> 8 & 255;
        let r = color & 255;
        a = roundStep(a, roundAlpha);
        if (oneBitAlpha) {
          const threshold = typeof oneBitAlpha === "number" ? oneBitAlpha : 127;
          a = a <= threshold ? 0 : 255;
        }
        r = roundStep(r, roundRGB);
        g = roundStep(g, roundRGB);
        b = roundStep(b, roundRGB);
        data[i] = a << 24 | b << 16 | g << 8 | r << 0;
      }
    }
    function applyPalette(rgba, palette, format = "rgb565") {
      if (!rgba || !rgba.buffer) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (!(rgba instanceof Uint8Array) && !(rgba instanceof Uint8ClampedArray)) {
        throw new Error("quantize() expected RGBA Uint8Array data");
      }
      if (palette.length > 256) {
        throw new Error("applyPalette() only works with 256 colors or less");
      }
      const data = new Uint32Array(rgba.buffer);
      const length = data.length;
      const bincount = format === "rgb444" ? 4096 : 65536;
      const index = new Uint8Array(length);
      const cache = new Array(bincount);
      const hasAlpha = format === "rgba4444";
      if (format === "rgba4444") {
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const a = color >> 24 & 255;
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgba8888_to_rgba4444(r, g, b, a);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGBA(r, g, b, a, palette);
          index[i] = idx;
        }
      } else {
        const rgb888_to_key = format === "rgb444" ? rgb888_to_rgb444 : rgb888_to_rgb565;
        for (let i = 0; i < length; i++) {
          const color = data[i];
          const b = color >> 16 & 255;
          const g = color >> 8 & 255;
          const r = color & 255;
          const key = rgb888_to_key(r, g, b);
          const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGB(r, g, b, palette);
          index[i] = idx;
        }
      }
      return index;
    }
    function nearestColorIndexRGBA(r, g, b, a, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const a2 = px2[3];
        let curdist = sqr2(a2 - a);
        if (curdist > mindist)
          continue;
        const r2 = px2[0];
        curdist += sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function nearestColorIndexRGB(r, g, b, palette) {
      let k = 0;
      let mindist = 1e100;
      for (let i = 0; i < palette.length; i++) {
        const px2 = palette[i];
        const r2 = px2[0];
        let curdist = sqr2(r2 - r);
        if (curdist > mindist)
          continue;
        const g2 = px2[1];
        curdist += sqr2(g2 - g);
        if (curdist > mindist)
          continue;
        const b2 = px2[2];
        curdist += sqr2(b2 - b);
        if (curdist > mindist)
          continue;
        mindist = curdist;
        k = i;
      }
      return k;
    }
    function snapColorsToPalette(palette, knownColors, threshold = 5) {
      if (!palette.length || !knownColors.length)
        return;
      const paletteRGB = palette.map((p) => p.slice(0, 3));
      const thresholdSq = threshold * threshold;
      const dim = palette[0].length;
      for (let i = 0; i < knownColors.length; i++) {
        let color = knownColors[i];
        if (color.length < dim) {
          color = [color[0], color[1], color[2], 255];
        } else if (color.length > dim) {
          color = color.slice(0, 3);
        } else {
          color = color.slice();
        }
        const r = nearestColorIndexWithDistance(paletteRGB, color.slice(0, 3), euclideanDistanceSquared);
        const idx = r[0];
        const distanceSq = r[1];
        if (distanceSq > 0 && distanceSq <= thresholdSq) {
          palette[idx] = color;
        }
      }
    }
    function sqr2(a) {
      return a * a;
    }
    function nearestColorIndex(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return minDistIndex;
    }
    function nearestColorIndexWithDistance(colors, pixel, distanceFn = euclideanDistanceSquared) {
      let minDist = Infinity;
      let minDistIndex = -1;
      for (let j = 0; j < colors.length; j++) {
        const paletteColor = colors[j];
        const dist = distanceFn(pixel, paletteColor);
        if (dist < minDist) {
          minDist = dist;
          minDistIndex = j;
        }
      }
      return [minDistIndex, minDist];
    }
    function nearestColor(colors, pixel, distanceFn = euclideanDistanceSquared) {
      return colors[nearestColorIndex(colors, pixel, distanceFn)];
    }
    function GIFEncoder2(opt = {}) {
      const { initialCapacity = 4096, auto = true } = opt;
      const stream = createStream(initialCapacity);
      const HSIZE = 5003;
      const accum = new Uint8Array(256);
      const htab = new Int32Array(HSIZE);
      const codetab = new Int32Array(HSIZE);
      let hasInit = false;
      return {
        reset() {
          stream.reset();
          hasInit = false;
        },
        finish() {
          stream.writeByte(constants_default.trailer);
        },
        bytes() {
          return stream.bytes();
        },
        bytesView() {
          return stream.bytesView();
        },
        get buffer() {
          return stream.buffer;
        },
        get stream() {
          return stream;
        },
        writeHeader,
        writeFrame(index, width, height, opts = {}) {
          const {
            transparent = false,
            transparentIndex = 0,
            delay = 0,
            palette = null,
            repeat = 0,
            colorDepth = 8,
            dispose = -1
          } = opts;
          let first = false;
          if (auto) {
            if (!hasInit) {
              first = true;
              writeHeader();
              hasInit = true;
            }
          } else {
            first = Boolean(opts.first);
          }
          width = Math.max(0, Math.floor(width));
          height = Math.max(0, Math.floor(height));
          if (first) {
            if (!palette) {
              throw new Error("First frame must include a { palette } option");
            }
            encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth);
            encodeColorTable(stream, palette);
            if (repeat >= 0) {
              encodeNetscapeExt(stream, repeat);
            }
          }
          const delayTime = Math.round(delay / 10);
          encodeGraphicControlExt(stream, dispose, delayTime, transparent, transparentIndex);
          const useLocalColorTable = Boolean(palette) && !first;
          encodeImageDescriptor(stream, width, height, useLocalColorTable ? palette : null);
          if (useLocalColorTable)
            encodeColorTable(stream, palette);
          encodePixels(stream, index, width, height, colorDepth, accum, htab, codetab);
        }
      };
      function writeHeader() {
        writeUTFBytes(stream, "GIF89a");
      }
    }
    function encodeGraphicControlExt(stream, dispose, delay, transparent, transparentIndex) {
      stream.writeByte(33);
      stream.writeByte(249);
      stream.writeByte(4);
      if (transparentIndex < 0) {
        transparentIndex = 0;
        transparent = false;
      }
      var transp, disp;
      if (!transparent) {
        transp = 0;
        disp = 0;
      } else {
        transp = 1;
        disp = 2;
      }
      if (dispose >= 0) {
        disp = dispose & 7;
      }
      disp <<= 2;
      const userInput = 0;
      stream.writeByte(0 | disp | userInput | transp);
      writeUInt16(stream, delay);
      stream.writeByte(transparentIndex || 0);
      stream.writeByte(0);
    }
    function encodeLogicalScreenDescriptor(stream, width, height, palette, colorDepth = 8) {
      const globalColorTableFlag = 1;
      const sortFlag = 0;
      const globalColorTableSize = colorTableSize(palette.length) - 1;
      const fields = globalColorTableFlag << 7 | colorDepth - 1 << 4 | sortFlag << 3 | globalColorTableSize;
      const backgroundColorIndex = 0;
      const pixelAspectRatio = 0;
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      stream.writeBytes([fields, backgroundColorIndex, pixelAspectRatio]);
    }
    function encodeNetscapeExt(stream, repeat) {
      stream.writeByte(33);
      stream.writeByte(255);
      stream.writeByte(11);
      writeUTFBytes(stream, "NETSCAPE2.0");
      stream.writeByte(3);
      stream.writeByte(1);
      writeUInt16(stream, repeat);
      stream.writeByte(0);
    }
    function encodeColorTable(stream, palette) {
      const colorTableLength = 1 << colorTableSize(palette.length);
      for (let i = 0; i < colorTableLength; i++) {
        let color = [0, 0, 0];
        if (i < palette.length) {
          color = palette[i];
        }
        stream.writeByte(color[0]);
        stream.writeByte(color[1]);
        stream.writeByte(color[2]);
      }
    }
    function encodeImageDescriptor(stream, width, height, localPalette) {
      stream.writeByte(44);
      writeUInt16(stream, 0);
      writeUInt16(stream, 0);
      writeUInt16(stream, width);
      writeUInt16(stream, height);
      if (localPalette) {
        const interlace = 0;
        const sorted = 0;
        const palSize = colorTableSize(localPalette.length) - 1;
        stream.writeByte(128 | interlace | sorted | 0 | palSize);
      } else {
        stream.writeByte(0);
      }
    }
    function encodePixels(stream, index, width, height, colorDepth = 8, accum, htab, codetab) {
      lzwEncode_default(width, height, index, colorDepth, stream, accum, htab, codetab);
    }
    function writeUInt16(stream, short) {
      stream.writeByte(short & 255);
      stream.writeByte(short >> 8 & 255);
    }
    function writeUTFBytes(stream, text) {
      for (var i = 0; i < text.length; i++) {
        stream.writeByte(text.charCodeAt(i));
      }
    }
    function colorTableSize(length) {
      return Math.max(Math.ceil(Math.log2(length)), 1);
    }
    var src_default = GIFEncoder2;
  }
});

// dist/js/pixel-studio-source.js
var import_gifenc = __toESM(require_gifenc());

// dist/js/brush-geometry.js
function pixelBrushBounds(x, y, size, width) {
  const offset = Math.floor((width - 1) / 2);
  return {
    left: Math.max(0, x - offset),
    top: Math.max(0, y - offset),
    right: Math.min(size, x - offset + width),
    bottom: Math.min(size, y - offset + width)
  };
}

// dist/js/pixel-studio-source.js
(() => {
  const $ = (id) => document.getElementById(id), canvas = $("pixel-canvas"), ctx = canvas.getContext("2d");
  if (!canvas) return;
  let size = 32, frames = [], current = 0, layer = 0, tool = "pencil", grid = true, playing = null, drawing = false;
  let history = [], colour = 4278190335;
  const shell = $("pixel-canvas-shell"), brushPreview = document.createElement("div");
  brushPreview.className = "pixel-brush-preview";
  brushPreview.hidden = true;
  brushPreview.setAttribute("aria-hidden", "true");
  shell.append(brushPreview);
  let hoverPoint = null;
  function updateBrushPreview(event) {
    if (event) hoverPoint = { clientX: event.clientX, clientY: event.clientY, pointerType: event.pointerType };
    if (!hoverPoint || hoverPoint.pointerType === "touch" || playing || !["pencil", "eraser"].includes(tool) || +$("pixel-brush").value === 1) {
      brushPreview.hidden = true;
      return;
    }
    const rect = canvas.getBoundingClientRect(), parent = shell.getBoundingClientRect();
    if (hoverPoint.clientX < rect.left || hoverPoint.clientX >= rect.right || hoverPoint.clientY < rect.top || hoverPoint.clientY >= rect.bottom) {
      brushPreview.hidden = true;
      return;
    }
    const p = point(hoverPoint), bounds = pixelBrushBounds(p.x, p.y, size, +$("pixel-brush").value);
    brushPreview.hidden = false;
    brushPreview.dataset.mode = tool;
    brushPreview.style.left = rect.left - parent.left - shell.clientLeft + shell.scrollLeft + bounds.left * rect.width / size + "px";
    brushPreview.style.top = rect.top - parent.top - shell.clientTop + shell.scrollTop + bounds.top * rect.height / size + "px";
    brushPreview.style.width = (bounds.right - bounds.left) * rect.width / size + "px";
    brushPreview.style.height = (bounds.bottom - bounds.top) * rect.height / size + "px";
  }
  canvas.addEventListener("pointerenter", updateBrushPreview);
  canvas.addEventListener("pointerleave", () => {
    hoverPoint = null;
    brushPreview.hidden = true;
  });
  window.addEventListener("resize", () => updateBrushPreview());
  window.addEventListener("scroll", () => {
    hoverPoint = null;
    brushPreview.hidden = true;
  }, true);
  const palettes = {
    classic: ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff", "#ff8000", "#8000ff", "#008000", "#800000", "#000080", "#808080", "#c0c0c0", "#804000"],
    pastel: ["#ffffff", "#ffd1dc", "#ffb7b2", "#ffdac1", "#fff1ad", "#e2f0cb", "#b5ead7", "#b7e5ff", "#c7ceea", "#d7bde2", "#f8c8dc", "#cdb4db", "#a2d2ff", "#bde0fe", "#a8d5ba", "#77758b"],
    retro: ["#000000", "#0000aa", "#00aa00", "#00aaaa", "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa", "#555555", "#5555ff", "#55ff55", "#55ffff", "#ff5555", "#ff55ff", "#ffff55", "#ffffff"],
    grey: ["#000000", "#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777", "#888888", "#999999", "#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd", "#eeeeee", "#ffffff"]
  };
  function setColour(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    hex = hex.toLowerCase();
    colour = parseInt(hex.slice(1), 16) * 256 + 255 >>> 0;
    $("pixel-colour").value = hex;
    $("pixel-hex").value = hex;
    ["red", "green", "blue"].forEach((name, i) => {
      const value = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
      $("pixel-" + name).value = value;
      $("pixel-" + name + "-value").value = value;
    });
  }
  function backgroundColour() {
    const mode = $("pixel-background").value;
    return mode === "transparent" ? null : mode === "white" ? "#ffffff" : $("pixel-background-colour").value;
  }
  function exportComposite(frame) {
    const pixels = composite(frame), bg = backgroundColour();
    if (bg) {
      const rgb = parseInt(bg.slice(1), 16), back = [rgb >>> 16, rgb >>> 8 & 255, rgb & 255];
      for (let i = 0; i < pixels.length; i++) {
        const front = rgba(pixels[i]), alpha = front[3] / 255;
        const mix = back.map((v, c) => Math.round(front[c] * alpha + v * (1 - alpha)));
        pixels[i] = (mix[0] << 24 | mix[1] << 16 | mix[2] << 8 | 255) >>> 0;
      }
    }
    return pixels;
  }
  function renderPalette() {
    $("pixel-palette").replaceChildren();
    palettes[$("pixel-palette-set").value].forEach((hex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.style.background = hex;
      button.title = hex;
      button.setAttribute("aria-label", `Choose ${hex}`);
      button.addEventListener("click", () => setColour(hex));
      $("pixel-palette").append(button);
    });
  }
  function freshLayer(name = "Layer 1") {
    return { name, visible: true, pixels: new Uint32Array(size * size) };
  }
  function freshFrame() {
    return { layers: frames[0]?.layers.map((x) => freshLayer(x.name)) || [freshLayer()] };
  }
  function copyFrame(frame) {
    return { layers: frame.layers.map((x) => ({ name: x.name, visible: x.visible, pixels: new Uint32Array(x.pixels) })) };
  }
  function init(n = 32) {
    stop();
    size = n;
    frames = [{ layers: [freshLayer()] }];
    current = 0;
    layer = 0;
    history = [];
    update();
  }
  function rgba(n) {
    return [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
  }
  function composite(frame) {
    const out = new Uint32Array(size * size);
    for (const item of frame.layers) if (item.visible) {
      for (let i = 0; i < out.length; i++) if (item.pixels[i] & 255) out[i] = item.pixels[i];
    }
    return out;
  }
  function draw() {
    const cell = 512 / size;
    ctx.clearRect(0, 0, 512, 512);
    const bg = backgroundColour();
    $("pixel-canvas-shell").style.backgroundColor = bg || "#cbd3e0";
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 512, 512);
    }
    if ($("pixel-onion").checked && current > 0 && !playing) {
      const back = composite(frames[current - 1]);
      for (let i = 0; i < back.length; i++) if (back[i] & 255) {
        const c = rgba(back[i]);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.22)`;
        ctx.fillRect(i % size * cell, Math.floor(i / size) * cell, cell, cell);
      }
    }
    const data = composite(frames[current]);
    for (let i = 0; i < data.length; i++) if (data[i] & 255) {
      const c = rgba(data[i]);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
      ctx.fillRect(i % size * cell, Math.floor(i / size) * cell, cell, cell);
    }
    if (grid && !playing) {
      ctx.beginPath();
      for (let i = 0; i <= size; i++) {
        const p = i * cell + 0.5;
        ctx.moveTo(p, 0);
        ctx.lineTo(p, 512);
        ctx.moveTo(0, p);
        ctx.lineTo(512, p);
      }
      ctx.strokeStyle = `rgba(0,0,0,${+$("pixel-grid-opacity").value / 100})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    updateBrushPreview();
    $("pixel-info").textContent = `${size} \xD7 ${size} \xB7 frame ${current + 1}/${frames.length} \xB7 ${frames[current].layers[layer].name}`;
  }
  function renderLists() {
    $("pixel-layers").replaceChildren();
    frames[current].layers.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "pixel-list-row" + (i === layer ? " is-active" : "");
      const select = document.createElement("button");
      select.type = "button";
      select.textContent = item.name;
      select.addEventListener("click", () => {
        layer = i;
        update();
      });
      const visible = document.createElement("button");
      visible.type = "button";
      visible.textContent = item.visible ? "\u25C9" : "\u25CB";
      visible.title = item.visible ? "Hide layer" : "Show layer";
      visible.setAttribute("aria-label", visible.title);
      visible.addEventListener("click", () => {
        item.visible = !item.visible;
        update();
      });
      row.append(select, visible);
      $("pixel-layers").append(row);
    });
    $("pixel-frames").replaceChildren();
    frames.forEach((frame, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = i === current ? "is-active" : "";
      b.textContent = String(i + 1).padStart(2, "0");
      b.setAttribute("aria-label", `Frame ${i + 1}`);
      b.addEventListener("click", () => {
        stop();
        current = i;
        layer = Math.min(layer, frames[i].layers.length - 1);
        update();
      });
      $("pixel-frames").append(b);
    });
    $("pixel-undo").disabled = !history.length;
  }
  function update() {
    renderLists();
    draw();
  }
  function checkpoint() {
    history.push({ frame: current, data: copyFrame(frames[current]) });
    if (history.length > 25) history.shift();
    $("pixel-undo").disabled = false;
  }
  function point(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.min(size - 1, Math.max(0, Math.floor((e.clientX - rect.left) / rect.width * size))), y: Math.min(size - 1, Math.max(0, Math.floor((e.clientY - rect.top) / rect.height * size))) };
  }
  function paint(x, y) {
    const arr = frames[current].layers[layer].pixels, bounds = pixelBrushBounds(x, y, size, +$("pixel-brush").value);
    for (let py = bounds.top; py < bounds.bottom; py++) for (let px = bounds.left; px < bounds.right; px++) arr[py * size + px] = tool === "eraser" ? 0 : colour;
    draw();
  }
  function line(a, b) {
    const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
    for (let i = 0; i <= steps; i++) paint(Math.round(a.x + (b.x - a.x) * i / steps), Math.round(a.y + (b.y - a.y) * i / steps));
  }
  function flood(x, y) {
    const arr = frames[current].layers[layer].pixels, old = arr[y * size + x], value = colour;
    if (old === value) return;
    checkpoint();
    const stack = [y * size + x];
    while (stack.length) {
      const i = stack.pop();
      if (arr[i] !== old) continue;
      arr[i] = value;
      const px = i % size, py = Math.floor(i / size);
      if (px > 0) stack.push(i - 1);
      if (px < size - 1) stack.push(i + 1);
      if (py > 0) stack.push(i - size);
      if (py < size - 1) stack.push(i + size);
    }
    draw();
  }
  function pick(x, y) {
    const val = composite(frames[current])[y * size + x];
    if (!(val & 255)) return;
    setColour("#" + (val >>> 8).toString(16).padStart(6, "0"));
  }
  let previous;
  canvas.addEventListener("pointerdown", (e) => {
    if (playing) return;
    e.preventDefault();
    const p = point(e);
    if (tool === "picker") {
      pick(p.x, p.y);
      return;
    }
    if (tool === "fill") {
      flood(p.x, p.y);
      return;
    }
    checkpoint();
    drawing = true;
    previous = p;
    canvas.setPointerCapture(e.pointerId);
    paint(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    updateBrushPreview(e);
    if (!drawing) return;
    const p = point(e);
    line(previous, p);
    previous = p;
  });
  canvas.addEventListener("pointerup", () => drawing = false);
  canvas.addEventListener("pointercancel", () => drawing = false);
  document.querySelectorAll("[data-pixel-tool]").forEach((b) => b.addEventListener("click", () => {
    tool = b.dataset.pixelTool;
    updateBrushPreview();
    document.querySelectorAll("[data-pixel-tool]").forEach((x) => x.classList.toggle("is-active", x === b));
  }));
  renderPalette();
  setColour("#ff0000");
  $("pixel-palette-set").addEventListener("change", renderPalette);
  $("pixel-colour").addEventListener("input", (e) => setColour(e.target.value));
  $("pixel-hex").addEventListener("change", (e) => {
    let hex = e.target.value;
    if (!hex.startsWith("#")) hex = "#" + hex;
    setColour(hex);
  });
  ["red", "green", "blue"].forEach((name) => $("pixel-" + name).addEventListener("input", () => setColour("#" + ["red", "green", "blue"].map((n) => (+$("pixel-" + n).value).toString(16).padStart(2, "0")).join(""))));
  $("pixel-grid-opacity").addEventListener("input", (e) => {
    $("pixel-grid-opacity-value").value = e.target.value + "%";
    draw();
  });
  $("pixel-background").addEventListener("change", () => {
    $("pixel-background-colour").hidden = $("pixel-background").value !== "colour";
    draw();
  });
  $("pixel-background-colour").addEventListener("input", draw);
  $("pixel-brush").addEventListener("input", (e) => {
    $("pixel-brush-value").value = e.target.value;
    updateBrushPreview();
  });
  $("pixel-fps").addEventListener("input", (e) => {
    $("pixel-fps-value").value = e.target.value;
    if (playing) {
      stop();
      play();
    }
  });
  $("pixel-onion").addEventListener("change", draw);
  $("pixel-grid").addEventListener("click", () => {
    grid = !grid;
    $("pixel-grid").textContent = grid ? "Hide grid" : "Show grid";
    $("pixel-grid").setAttribute("aria-pressed", String(grid));
    draw();
  });
  $("pixel-undo").addEventListener("click", () => {
    const last = history.pop();
    if (!last) return;
    current = last.frame;
    frames[current] = last.data;
    layer = Math.min(layer, frames[current].layers.length - 1);
    update();
  });
  $("pixel-new").addEventListener("click", () => {
    if (frames.some((f) => f.layers.some((l) => l.pixels.some(Boolean))) && !confirm("Start a new blank canvas? Your current drawing will be cleared.")) return;
    init(+$("pixel-size").value);
  });
  $("pixel-size").addEventListener("change", () => {
    $("pixel-status").textContent = "Press New blank canvas to apply this size.";
  });
  $("pixel-add-layer").addEventListener("click", () => {
    const name = `Layer ${frames[current].layers.length + 1}`;
    frames.forEach((f) => f.layers.push(freshLayer(name)));
    layer = frames[current].layers.length - 1;
    update();
  });
  $("pixel-add-frame").addEventListener("click", () => {
    stop();
    frames.splice(current + 1, 0, freshFrame());
    current++;
    update();
  });
  $("pixel-duplicate-frame").addEventListener("click", () => {
    stop();
    frames.splice(current + 1, 0, copyFrame(frames[current]));
    current++;
    update();
  });
  $("pixel-delete-frame").addEventListener("click", () => {
    if (frames.length === 1) return;
    stop();
    frames.splice(current, 1);
    current = Math.min(current, frames.length - 1);
    layer = Math.min(layer, frames[current].layers.length - 1);
    update();
  });
  function stop() {
    if (playing) {
      clearInterval(playing);
      playing = null;
      $("pixel-play").textContent = "Play";
    }
    if (frames.length) draw();
  }
  function play() {
    if (frames.length < 2) {
      $("pixel-status").textContent = "Add another frame to preview an animation.";
      return;
    }
    const interval = 1e3 / +$("pixel-fps").value;
    playing = setInterval(() => {
      current = (current + 1) % frames.length;
      renderLists();
      draw();
    }, interval);
    $("pixel-play").textContent = "Stop";
  }
  $("pixel-play").addEventListener("click", () => playing ? stop() : play());
  function pixelsToRGBA(pixels) {
    const out = new Uint8ClampedArray(size * size * 4);
    for (let i = 0; i < pixels.length; i++) {
      const c = rgba(pixels[i]);
      out.set(c, i * 4);
    }
    return out;
  }
  function save(blob, filename) {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 6e4);
  }
  $("pixel-download-png").addEventListener("click", () => {
    const temp = document.createElement("canvas");
    temp.width = size;
    temp.height = size;
    temp.getContext("2d").putImageData(new ImageData(pixelsToRGBA(exportComposite(frames[current])), size, size), 0, 0);
    temp.toBlob((blob) => save(blob, "bootleg-pixel-art.png"), "image/png");
  });
  $("pixel-download-gif").addEventListener("click", () => {
    const colors = /* @__PURE__ */ new Map(), palette = [[0, 0, 0]];
    for (const frame of frames) for (const c of exportComposite(frame)) {
      if (!(c & 255)) continue;
      const rgb = c >>> 8;
      if (!colors.has(rgb) && palette.length < 256) {
        colors.set(rgb, palette.length);
        palette.push([rgb >> 16 & 255, rgb >> 8 & 255, rgb & 255]);
      }
    }
    const gif = (0, import_gifenc.GIFEncoder)();
    for (const frame of frames) {
      const merged = exportComposite(frame), indexed = new Uint8Array(size * size);
      for (let i = 0; i < merged.length; i++) {
        const c = merged[i];
        if (!(c & 255)) continue;
        const rgb = c >>> 8;
        let index = colors.get(rgb);
        if (index === void 0) {
          let best = Infinity;
          for (let j = 1; j < palette.length; j++) {
            const p = palette[j], d = (p[0] - (rgb >> 16)) ** 2 + (p[1] - (rgb >> 8 & 255)) ** 2 + (p[2] - (rgb & 255)) ** 2;
            if (d < best) {
              best = d;
              index = j;
            }
          }
        }
        indexed[i] = index;
      }
      gif.writeFrame(indexed, size, size, { palette, transparent: true, transparentIndex: 0, delay: Math.round(1e3 / +$("pixel-fps").value), repeat: 0, dispose: 2 });
    }
    gif.finish();
    save(new Blob([gif.bytes()], { type: "image/gif" }), "bootleg-pixel-animation.gif");
    $("pixel-status").textContent = `Exported ${frames.length} frame${frames.length === 1 ? "" : "s"} as GIF.`;
  });
  $("pixel-import").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const image = await createImageBitmap(file), temp = document.createElement("canvas");
      temp.width = size;
      temp.height = size;
      const t = temp.getContext("2d");
      t.imageSmoothingEnabled = false;
      const scale = Math.min(size / image.width, size / image.height), w = Math.max(1, Math.round(image.width * scale)), h = Math.max(1, Math.round(image.height * scale));
      t.drawImage(image, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
      image.close();
      checkpoint();
      const data = t.getImageData(0, 0, size, size).data, layerData = frames[current].layers[layer].pixels;
      for (let i = 0; i < layerData.length; i++) layerData[i] = (data[i * 4] << 24 | data[i * 4 + 1] << 16 | data[i * 4 + 2] << 8 | data[i * 4 + 3]) >>> 0;
      update();
      $("pixel-status").textContent = "Image imported into the selected layer.";
    } catch (err) {
      $("pixel-status").textContent = "Could not import image: " + err.message;
    }
  });
  init();
})();
