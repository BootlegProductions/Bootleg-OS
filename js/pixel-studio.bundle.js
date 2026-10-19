(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
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

  // pixel-build/node_modules/gifenc/dist/gifenc.js
  var require_gifenc = __commonJS({
    "pixel-build/node_modules/gifenc/dist/gifenc.js"(exports) {
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
            for (let i2 = 0; i2 < byteLength; i2++) {
              contents[cursor++] = data[i2 + offset];
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
            let i2 = c << hshift ^ ent;
            if (htab[i2] === fcode) {
              ent = codetab[i2];
              break next_block;
            }
            const disp = i2 === 0 ? 1 : hsize - i2;
            while (htab[i2] >= 0) {
              i2 -= disp;
              if (i2 < 0)
                i2 += hsize;
              if (htab[i2] === fcode) {
                ent = codetab[i2];
                break next_block;
              }
            }
            output(ent);
            ent = c;
            if (free_ent < 1 << BITS) {
              codetab[i2] = free_ent++;
              htab[i2] = fcode;
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
      function clamp(value, min, max2) {
        return value < min ? min : value > max2 ? max2 : value;
      }
      function sqr(value) {
        return value * value;
      }
      function find_nn(bins, idx, hasAlpha) {
        var nn = 0;
        var err2 = 1e100;
        const bin1 = bins[idx];
        const n1 = bin1.cnt;
        const wa = bin1.ac;
        const wr = bin1.rc;
        const wg = bin1.gc;
        const wb = bin1.bc;
        for (var i2 = bin1.fw; i2 != 0; i2 = bins[i2].fw) {
          const bin = bins[i2];
          const n2 = bin.cnt;
          const nerr2 = n1 * n2 / (n1 + n2);
          if (nerr2 >= err2)
            continue;
          var nerr = 0;
          if (hasAlpha) {
            nerr += nerr2 * sqr(bin.ac - wa);
            if (nerr >= err2)
              continue;
          }
          nerr += nerr2 * sqr(bin.rc - wr);
          if (nerr >= err2)
            continue;
          nerr += nerr2 * sqr(bin.gc - wg);
          if (nerr >= err2)
            continue;
          nerr += nerr2 * sqr(bin.bc - wb);
          if (nerr >= err2)
            continue;
          err2 = nerr;
          nn = i2;
        }
        bin1.err = err2;
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
          for (let i2 = 0; i2 < size; ++i2) {
            const color = data[i2];
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
          for (let i2 = 0; i2 < size; ++i2) {
            const color = data[i2];
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
          for (let i2 = 0; i2 < size; ++i2) {
            const color = data[i2];
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
        for (var i2 = 0; i2 < bincount; ++i2) {
          const bin = bins[i2];
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
        var i2 = 0;
        for (; i2 < maxbins - 1; ++i2) {
          bins[i2].fw = i2 + 1;
          bins[i2 + 1].bk = i2;
          if (useSqrt)
            bins[i2].cnt = Math.sqrt(bins[i2].cnt);
        }
        if (useSqrt)
          bins[i2].cnt = Math.sqrt(bins[i2].cnt);
        var h, l, l2;
        for (i2 = 0; i2 < maxbins; ++i2) {
          find_nn(bins, i2, false);
          var err2 = bins[i2].err;
          for (l = ++heap[0]; l > 1; l = l2) {
            l2 = l >> 1;
            if (bins[h = heap[l2]].err <= err2)
              break;
            heap[l] = h;
          }
          heap[l] = i2;
        }
        var extbins = maxbins - maxColors;
        for (i2 = 0; i2 < extbins; ) {
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
              tb.tm = i2;
            }
            var err2 = bins[b1].err;
            for (l = 1; (l2 = l + l) <= heap[0]; l = l2) {
              if (l2 < heap[0] && bins[heap[l2]].err > bins[heap[l2 + 1]].err)
                l2++;
              if (err2 <= bins[h = heap[l2]].err)
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
          tb.mtm = ++i2;
          bins[nb.bk].fw = nb.fw;
          bins[nb.fw].bk = nb.bk;
          nb.mtm = bincountMinusOne;
        }
        let palette = [];
        var k = 0;
        for (i2 = 0; ; ++k) {
          let r = clamp(Math.round(bins[i2].rc), 0, 255);
          let g = clamp(Math.round(bins[i2].gc), 0, 255);
          let b = clamp(Math.round(bins[i2].bc), 0, 255);
          let a = 255;
          if (hasAlpha) {
            a = clamp(Math.round(bins[i2].ac), 0, 255);
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
          if ((i2 = bins[i2].fw) == 0)
            break;
        }
        return palette;
      }
      function existsInPalette(palette, color) {
        for (let i2 = 0; i2 < palette.length; i2++) {
          const p = palette[i2];
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
        for (let i2 = 0; i2 < data.length; i2++) {
          const color = data[i2];
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
          data[i2] = a << 24 | b << 16 | g << 8 | r << 0;
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
          for (let i2 = 0; i2 < length; i2++) {
            const color = data[i2];
            const a = color >> 24 & 255;
            const b = color >> 16 & 255;
            const g = color >> 8 & 255;
            const r = color & 255;
            const key = rgba8888_to_rgba4444(r, g, b, a);
            const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGBA(r, g, b, a, palette);
            index[i2] = idx;
          }
        } else {
          const rgb888_to_key = format === "rgb444" ? rgb888_to_rgb444 : rgb888_to_rgb565;
          for (let i2 = 0; i2 < length; i2++) {
            const color = data[i2];
            const b = color >> 16 & 255;
            const g = color >> 8 & 255;
            const r = color & 255;
            const key = rgb888_to_key(r, g, b);
            const idx = key in cache ? cache[key] : cache[key] = nearestColorIndexRGB(r, g, b, palette);
            index[i2] = idx;
          }
        }
        return index;
      }
      function nearestColorIndexRGBA(r, g, b, a, palette) {
        let k = 0;
        let mindist = 1e100;
        for (let i2 = 0; i2 < palette.length; i2++) {
          const px2 = palette[i2];
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
          const b22 = px2[2];
          curdist += sqr2(b22 - b);
          if (curdist > mindist)
            continue;
          mindist = curdist;
          k = i2;
        }
        return k;
      }
      function nearestColorIndexRGB(r, g, b, palette) {
        let k = 0;
        let mindist = 1e100;
        for (let i2 = 0; i2 < palette.length; i2++) {
          const px2 = palette[i2];
          const r2 = px2[0];
          let curdist = sqr2(r2 - r);
          if (curdist > mindist)
            continue;
          const g2 = px2[1];
          curdist += sqr2(g2 - g);
          if (curdist > mindist)
            continue;
          const b22 = px2[2];
          curdist += sqr2(b22 - b);
          if (curdist > mindist)
            continue;
          mindist = curdist;
          k = i2;
        }
        return k;
      }
      function snapColorsToPalette(palette, knownColors, threshold = 5) {
        if (!palette.length || !knownColors.length)
          return;
        const paletteRGB = palette.map((p) => p.slice(0, 3));
        const thresholdSq = threshold * threshold;
        const dim = palette[0].length;
        for (let i2 = 0; i2 < knownColors.length; i2++) {
          let color = knownColors[i2];
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
        for (let i2 = 0; i2 < colorTableLength; i2++) {
          let color = [0, 0, 0];
          if (i2 < palette.length) {
            color = palette[i2];
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
        for (var i2 = 0; i2 < text.length; i2++) {
          stream.writeByte(text.charCodeAt(i2));
        }
      }
      function colorTableSize(length) {
        return Math.max(Math.ceil(Math.log2(length)), 1);
      }
      var src_default = GIFEncoder2;
    }
  });

  // pixel-build/node_modules/js-binary-schema-parser/lib/index.js
  var require_lib = __commonJS({
    "pixel-build/node_modules/js-binary-schema-parser/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.loop = exports.conditional = exports.parse = void 0;
      var parse = function parse2(stream, schema) {
        var result = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        var parent = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : result;
        if (Array.isArray(schema)) {
          schema.forEach(function(partSchema) {
            return parse2(stream, partSchema, result, parent);
          });
        } else if (typeof schema === "function") {
          schema(stream, result, parent, parse2);
        } else {
          var key = Object.keys(schema)[0];
          if (Array.isArray(schema[key])) {
            parent[key] = {};
            parse2(stream, schema[key], result, parent[key]);
          } else {
            parent[key] = schema[key](stream, result, parent, parse2);
          }
        }
        return result;
      };
      exports.parse = parse;
      var conditional = function conditional2(schema, conditionFunc) {
        return function(stream, result, parent, parse2) {
          if (conditionFunc(stream, result, parent)) {
            parse2(stream, schema, result, parent);
          }
        };
      };
      exports.conditional = conditional;
      var loop = function loop2(schema, continueFunc) {
        return function(stream, result, parent, parse2) {
          var arr = [];
          var lastStreamPos = stream.pos;
          while (continueFunc(stream, result, parent)) {
            var newParent = {};
            parse2(stream, schema, result, newParent);
            if (stream.pos === lastStreamPos) {
              break;
            }
            lastStreamPos = stream.pos;
            arr.push(newParent);
          }
          return arr;
        };
      };
      exports.loop = loop;
    }
  });

  // pixel-build/node_modules/js-binary-schema-parser/lib/parsers/uint8.js
  var require_uint8 = __commonJS({
    "pixel-build/node_modules/js-binary-schema-parser/lib/parsers/uint8.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.readBits = exports.readArray = exports.readUnsigned = exports.readString = exports.peekBytes = exports.readBytes = exports.peekByte = exports.readByte = exports.buildStream = void 0;
      var buildStream = function buildStream2(uint8Data) {
        return {
          data: uint8Data,
          pos: 0
        };
      };
      exports.buildStream = buildStream;
      var readByte = function readByte2() {
        return function(stream) {
          return stream.data[stream.pos++];
        };
      };
      exports.readByte = readByte;
      var peekByte = function peekByte2() {
        var offset = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 0;
        return function(stream) {
          return stream.data[stream.pos + offset];
        };
      };
      exports.peekByte = peekByte;
      var readBytes = function readBytes2(length) {
        return function(stream) {
          return stream.data.subarray(stream.pos, stream.pos += length);
        };
      };
      exports.readBytes = readBytes;
      var peekBytes = function peekBytes2(length) {
        return function(stream) {
          return stream.data.subarray(stream.pos, stream.pos + length);
        };
      };
      exports.peekBytes = peekBytes;
      var readString = function readString2(length) {
        return function(stream) {
          return Array.from(readBytes(length)(stream)).map(function(value) {
            return String.fromCharCode(value);
          }).join("");
        };
      };
      exports.readString = readString;
      var readUnsigned = function readUnsigned2(littleEndian) {
        return function(stream) {
          var bytes = readBytes(2)(stream);
          return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1];
        };
      };
      exports.readUnsigned = readUnsigned;
      var readArray = function readArray2(byteSize, totalOrFunc) {
        return function(stream, result, parent) {
          var total = typeof totalOrFunc === "function" ? totalOrFunc(stream, result, parent) : totalOrFunc;
          var parser = readBytes(byteSize);
          var arr = new Array(total);
          for (var i2 = 0; i2 < total; i2++) {
            arr[i2] = parser(stream);
          }
          return arr;
        };
      };
      exports.readArray = readArray;
      var subBitsTotal = function subBitsTotal2(bits2, startIndex, length) {
        var result = 0;
        for (var i2 = 0; i2 < length; i2++) {
          result += bits2[startIndex + i2] && Math.pow(2, length - i2 - 1);
        }
        return result;
      };
      var readBits = function readBits2(schema) {
        return function(stream) {
          var _byte = readByte()(stream);
          var bits2 = new Array(8);
          for (var i2 = 0; i2 < 8; i2++) {
            bits2[7 - i2] = !!(_byte & 1 << i2);
          }
          return Object.keys(schema).reduce(function(res, key) {
            var def = schema[key];
            if (def.length) {
              res[key] = subBitsTotal(bits2, def.index, def.length);
            } else {
              res[key] = bits2[def.index];
            }
            return res;
          }, {});
        };
      };
      exports.readBits = readBits;
    }
  });

  // pixel-build/node_modules/js-binary-schema-parser/lib/schemas/gif.js
  var require_gif = __commonJS({
    "pixel-build/node_modules/js-binary-schema-parser/lib/schemas/gif.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports["default"] = void 0;
      var _ = require_lib();
      var _uint = require_uint8();
      var subBlocksSchema = {
        blocks: function blocks(stream) {
          var terminator = 0;
          var chunks = [];
          var streamSize = stream.data.length;
          var total = 0;
          for (var size = (0, _uint.readByte)()(stream); size !== terminator; size = (0, _uint.readByte)()(stream)) {
            if (!size) break;
            if (stream.pos + size >= streamSize) {
              var availableSize = streamSize - stream.pos;
              chunks.push((0, _uint.readBytes)(availableSize)(stream));
              total += availableSize;
              break;
            }
            chunks.push((0, _uint.readBytes)(size)(stream));
            total += size;
          }
          var result = new Uint8Array(total);
          var offset = 0;
          for (var i2 = 0; i2 < chunks.length; i2++) {
            result.set(chunks[i2], offset);
            offset += chunks[i2].length;
          }
          return result;
        }
      };
      var gceSchema = (0, _.conditional)({
        gce: [{
          codes: (0, _uint.readBytes)(2)
        }, {
          byteSize: (0, _uint.readByte)()
        }, {
          extras: (0, _uint.readBits)({
            future: {
              index: 0,
              length: 3
            },
            disposal: {
              index: 3,
              length: 3
            },
            userInput: {
              index: 6
            },
            transparentColorGiven: {
              index: 7
            }
          })
        }, {
          delay: (0, _uint.readUnsigned)(true)
        }, {
          transparentColorIndex: (0, _uint.readByte)()
        }, {
          terminator: (0, _uint.readByte)()
        }]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 249;
      });
      var imageSchema = (0, _.conditional)({
        image: [{
          code: (0, _uint.readByte)()
        }, {
          descriptor: [{
            left: (0, _uint.readUnsigned)(true)
          }, {
            top: (0, _uint.readUnsigned)(true)
          }, {
            width: (0, _uint.readUnsigned)(true)
          }, {
            height: (0, _uint.readUnsigned)(true)
          }, {
            lct: (0, _uint.readBits)({
              exists: {
                index: 0
              },
              interlaced: {
                index: 1
              },
              sort: {
                index: 2
              },
              future: {
                index: 3,
                length: 2
              },
              size: {
                index: 5,
                length: 3
              }
            })
          }]
        }, (0, _.conditional)({
          lct: (0, _uint.readArray)(3, function(stream, result, parent) {
            return Math.pow(2, parent.descriptor.lct.size + 1);
          })
        }, function(stream, result, parent) {
          return parent.descriptor.lct.exists;
        }), {
          data: [{
            minCodeSize: (0, _uint.readByte)()
          }, subBlocksSchema]
        }]
      }, function(stream) {
        return (0, _uint.peekByte)()(stream) === 44;
      });
      var textSchema = (0, _.conditional)({
        text: [{
          codes: (0, _uint.readBytes)(2)
        }, {
          blockSize: (0, _uint.readByte)()
        }, {
          preData: function preData(stream, result, parent) {
            return (0, _uint.readBytes)(parent.text.blockSize)(stream);
          }
        }, subBlocksSchema]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 1;
      });
      var applicationSchema = (0, _.conditional)({
        application: [{
          codes: (0, _uint.readBytes)(2)
        }, {
          blockSize: (0, _uint.readByte)()
        }, {
          id: function id(stream, result, parent) {
            return (0, _uint.readString)(parent.blockSize)(stream);
          }
        }, subBlocksSchema]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 255;
      });
      var commentSchema = (0, _.conditional)({
        comment: [{
          codes: (0, _uint.readBytes)(2)
        }, subBlocksSchema]
      }, function(stream) {
        var codes = (0, _uint.peekBytes)(2)(stream);
        return codes[0] === 33 && codes[1] === 254;
      });
      var schema = [
        {
          header: [{
            signature: (0, _uint.readString)(3)
          }, {
            version: (0, _uint.readString)(3)
          }]
        },
        {
          lsd: [{
            width: (0, _uint.readUnsigned)(true)
          }, {
            height: (0, _uint.readUnsigned)(true)
          }, {
            gct: (0, _uint.readBits)({
              exists: {
                index: 0
              },
              resolution: {
                index: 1,
                length: 3
              },
              sort: {
                index: 4
              },
              size: {
                index: 5,
                length: 3
              }
            })
          }, {
            backgroundColorIndex: (0, _uint.readByte)()
          }, {
            pixelAspectRatio: (0, _uint.readByte)()
          }]
        },
        (0, _.conditional)({
          gct: (0, _uint.readArray)(3, function(stream, result) {
            return Math.pow(2, result.lsd.gct.size + 1);
          })
        }, function(stream, result) {
          return result.lsd.gct.exists;
        }),
        // content frames
        {
          frames: (0, _.loop)([gceSchema, applicationSchema, commentSchema, imageSchema, textSchema], function(stream) {
            var nextCode = (0, _uint.peekByte)()(stream);
            return nextCode === 33 || nextCode === 44;
          })
        }
      ];
      var _default = schema;
      exports["default"] = _default;
    }
  });

  // pixel-build/node_modules/gifuct-js/lib/deinterlace.js
  var require_deinterlace = __commonJS({
    "pixel-build/node_modules/gifuct-js/lib/deinterlace.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.deinterlace = void 0;
      var deinterlace = function deinterlace2(pixels, width) {
        var newPixels = new Array(pixels.length);
        var rows = pixels.length / width;
        var cpRow = function cpRow2(toRow2, fromRow2) {
          var fromPixels = pixels.slice(fromRow2 * width, (fromRow2 + 1) * width);
          newPixels.splice.apply(newPixels, [toRow2 * width, width].concat(fromPixels));
        };
        var offsets = [0, 4, 2, 1];
        var steps = [8, 8, 4, 2];
        var fromRow = 0;
        for (var pass = 0; pass < 4; pass++) {
          for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
            cpRow(toRow, fromRow);
            fromRow++;
          }
        }
        return newPixels;
      };
      exports.deinterlace = deinterlace;
    }
  });

  // pixel-build/node_modules/gifuct-js/lib/lzw.js
  var require_lzw = __commonJS({
    "pixel-build/node_modules/gifuct-js/lib/lzw.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.lzw = void 0;
      var lzw = function lzw2(minCodeSize, data, pixelCount) {
        var MAX_STACK_SIZE = 4096;
        var nullCode = -1;
        var npix = pixelCount;
        var available, clear, code_mask, code_size, end_of_information, in_code, old_code, bits2, code, i2, datum, data_size, first, top, bi, pi;
        var dstPixels = new Array(pixelCount);
        var prefix = new Array(MAX_STACK_SIZE);
        var suffix = new Array(MAX_STACK_SIZE);
        var pixelStack = new Array(MAX_STACK_SIZE + 1);
        data_size = minCodeSize;
        clear = 1 << data_size;
        end_of_information = clear + 1;
        available = clear + 2;
        old_code = nullCode;
        code_size = data_size + 1;
        code_mask = (1 << code_size) - 1;
        for (code = 0; code < clear; code++) {
          prefix[code] = 0;
          suffix[code] = code;
        }
        var datum, bits2, count, first, top, pi, bi;
        datum = bits2 = count = first = top = pi = bi = 0;
        for (i2 = 0; i2 < npix; ) {
          if (top === 0) {
            if (bits2 < code_size) {
              datum += data[bi] << bits2;
              bits2 += 8;
              bi++;
              continue;
            }
            code = datum & code_mask;
            datum >>= code_size;
            bits2 -= code_size;
            if (code > available || code == end_of_information) {
              break;
            }
            if (code == clear) {
              code_size = data_size + 1;
              code_mask = (1 << code_size) - 1;
              available = clear + 2;
              old_code = nullCode;
              continue;
            }
            if (old_code == nullCode) {
              pixelStack[top++] = suffix[code];
              old_code = code;
              first = code;
              continue;
            }
            in_code = code;
            if (code == available) {
              pixelStack[top++] = first;
              code = old_code;
            }
            while (code > clear) {
              pixelStack[top++] = suffix[code];
              code = prefix[code];
            }
            first = suffix[code] & 255;
            pixelStack[top++] = first;
            if (available < MAX_STACK_SIZE) {
              prefix[available] = old_code;
              suffix[available] = first;
              available++;
              if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
                code_size++;
                code_mask += available;
              }
            }
            old_code = in_code;
          }
          top--;
          dstPixels[pi++] = pixelStack[top];
          i2++;
        }
        for (i2 = pi; i2 < npix; i2++) {
          dstPixels[i2] = 0;
        }
        return dstPixels;
      };
      exports.lzw = lzw;
    }
  });

  // pixel-build/node_modules/gifuct-js/lib/index.js
  var require_lib2 = __commonJS({
    "pixel-build/node_modules/gifuct-js/lib/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.decompressFrames = exports.decompressFrame = exports.parseGIF = void 0;
      var _gif = _interopRequireDefault(require_gif());
      var _jsBinarySchemaParser = require_lib();
      var _uint = require_uint8();
      var _deinterlace = require_deinterlace();
      var _lzw = require_lzw();
      function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : { "default": obj };
      }
      var parseGIF2 = function parseGIF3(arrayBuffer) {
        var byteData = new Uint8Array(arrayBuffer);
        return (0, _jsBinarySchemaParser.parse)((0, _uint.buildStream)(byteData), _gif["default"]);
      };
      exports.parseGIF = parseGIF2;
      var generatePatch = function generatePatch2(image) {
        var totalPixels = image.pixels.length;
        var patchData = new Uint8ClampedArray(totalPixels * 4);
        for (var i2 = 0; i2 < totalPixels; i2++) {
          var pos = i2 * 4;
          var colorIndex = image.pixels[i2];
          var color = image.colorTable[colorIndex] || [0, 0, 0];
          patchData[pos] = color[0];
          patchData[pos + 1] = color[1];
          patchData[pos + 2] = color[2];
          patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0;
        }
        return patchData;
      };
      var decompressFrame = function decompressFrame2(frame, gct, buildImagePatch) {
        if (!frame.image) {
          console.warn("gif frame does not have associated image.");
          return;
        }
        var image = frame.image;
        var totalPixels = image.descriptor.width * image.descriptor.height;
        var pixels = (0, _lzw.lzw)(image.data.minCodeSize, image.data.blocks, totalPixels);
        if (image.descriptor.lct.interlaced) {
          pixels = (0, _deinterlace.deinterlace)(pixels, image.descriptor.width);
        }
        var resultImage = {
          pixels,
          dims: {
            top: frame.image.descriptor.top,
            left: frame.image.descriptor.left,
            width: frame.image.descriptor.width,
            height: frame.image.descriptor.height
          }
        };
        if (image.descriptor.lct && image.descriptor.lct.exists) {
          resultImage.colorTable = image.lct;
        } else {
          resultImage.colorTable = gct;
        }
        if (frame.gce) {
          resultImage.delay = (frame.gce.delay || 10) * 10;
          resultImage.disposalType = frame.gce.extras.disposal;
          if (frame.gce.extras.transparentColorGiven) {
            resultImage.transparentIndex = frame.gce.transparentColorIndex;
          }
        }
        if (buildImagePatch) {
          resultImage.patch = generatePatch(resultImage);
        }
        return resultImage;
      };
      exports.decompressFrame = decompressFrame;
      var decompressFrames2 = function decompressFrames3(parsedGif, buildImagePatches) {
        return parsedGif.frames.filter(function(f) {
          return f.image;
        }).map(function(f) {
          return decompressFrame(f, parsedGif.gct, buildImagePatches);
        });
      };
      exports.decompressFrames = decompressFrames2;
    }
  });

  // site-work/js/pixel-studio-source.js
  var import_gifenc = __toESM(require_gifenc());

  // site-work/js/brush-geometry.js
  function pixelBrushBounds(x2, y, size, width, height = size) {
    const offset = Math.floor((width - 1) / 2);
    return {
      left: Math.max(0, x2 - offset),
      top: Math.max(0, y - offset),
      right: Math.min(size, x2 - offset + width),
      bottom: Math.min(height, y - offset + width)
    };
  }

  // pixel-build/node_modules/fflate/esm/browser.js
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var hMap = (function(cd, mb, r) {
    var s = cd.length;
    var i2 = 0;
    var l = new u16(mb);
    for (; i2 < s; ++i2) {
      if (cd[i2])
        ++l[cd[i2] - 1];
    }
    var le = new u16(mb);
    for (i2 = 1; i2 < mb; ++i2) {
      le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          var sv = i2 << 4 | cd[i2];
          var r_1 = mb - cd[i2];
          var v = le[cd[i2] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
        }
      }
    }
    return co;
  });
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
  var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
  var max = function(a) {
    var m = a[0];
    for (var i2 = 1; i2 < a.length; ++i2) {
      if (a[i2] > m)
        m = a[i2];
    }
    return m;
  };
  var bits = function(d, p, m) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
  };
  var bits16 = function(d, p) {
    var o = p / 8 | 0;
    return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
  };
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var ec = [
    "unexpected EOF",
    "invalid block type",
    "invalid length/literal",
    "invalid distance",
    "stream finished",
    "no stream handler",
    ,
    // determined by compression function
    "no callback",
    "invalid UTF-8 data",
    "extra field too long",
    "date not in range 1980-2099",
    "filename too long",
    "stream finishing",
    "invalid zip data"
    // determined by unknown compression method
  ];
  var err = function(ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
      Error.captureStackTrace(e, err);
    if (!nt)
      throw e;
    return e;
  };
  var inflt = function(dat, st, buf, dict) {
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
      return buf || new u8(0);
    var noBuf = !buf;
    var resize = noBuf || st.i != 2;
    var noSt = st.i;
    if (noBuf)
      buf = new u8(sl * 3);
    var cbuf = function(l2) {
      var bl = buf.length;
      if (l2 > bl) {
        var nbuf = new u8(Math.max(bl * 2, l2));
        nbuf.set(buf);
        buf = nbuf;
      }
    };
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    var tbts = sl * 8;
    do {
      if (!lm) {
        final = bits(dat, pos, 1);
        var type = bits(dat, pos + 1, 3);
        pos += 3;
        if (!type) {
          var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
          if (t > sl) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + l);
          buf.set(dat.subarray(s, t), bt);
          st.b = bt += l, st.p = pos = t * 8, st.f = final;
          continue;
        } else if (type == 1)
          lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
        else if (type == 2) {
          var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
          var tl = hLit + bits(dat, pos + 5, 31) + 1;
          pos += 14;
          var ldt = new u8(tl);
          var clt = new u8(19);
          for (var i2 = 0; i2 < hcLen; ++i2) {
            clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
          }
          pos += hcLen * 3;
          var clb = max(clt), clbmsk = (1 << clb) - 1;
          var clm = hMap(clt, clb, 1);
          for (var i2 = 0; i2 < tl; ) {
            var r = clm[bits(dat, pos, clbmsk)];
            pos += r & 15;
            var s = r >> 4;
            if (s < 16) {
              ldt[i2++] = s;
            } else {
              var c = 0, n = 0;
              if (s == 16)
                n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
              else if (s == 17)
                n = 3 + bits(dat, pos, 7), pos += 3;
              else if (s == 18)
                n = 11 + bits(dat, pos, 127), pos += 7;
              while (n--)
                ldt[i2++] = c;
            }
          }
          var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
          lbt = max(lt);
          dbt = max(dt);
          lm = hMap(lt, lbt, 1);
          dm = hMap(dt, dbt, 1);
        } else
          err(1);
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
      }
      if (resize)
        cbuf(bt + 131072);
      var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
      var lpos = pos;
      for (; ; lpos = pos) {
        var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
        pos += c & 15;
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (!c)
          err(2);
        if (sym < 256)
          buf[bt++] = sym;
        else if (sym == 256) {
          lpos = pos, lm = null;
          break;
        } else {
          var add = sym - 254;
          if (sym > 264) {
            var i2 = sym - 257, b = fleb[i2];
            add = bits(dat, pos, (1 << b) - 1) + fl[i2];
            pos += b;
          }
          var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
          if (!d)
            err(3);
          pos += d & 15;
          var dt = fd[dsym];
          if (dsym > 3) {
            var b = fdeb[dsym];
            dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
          }
          if (pos > tbts) {
            if (noSt)
              err(0);
            break;
          }
          if (resize)
            cbuf(bt + 131072);
          var end = bt + add;
          if (bt < dt) {
            var shift = dl - dt, dend = Math.min(dt, end);
            if (shift + bt < 0)
              err(3);
            for (; bt < dend; ++bt)
              buf[bt] = dict[shift + bt];
          }
          for (; bt < end; ++bt)
            buf[bt] = buf[bt - dt];
        }
      }
      st.l = lm, st.p = lpos, st.b = bt, st.f = final;
      if (lm)
        final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
  };
  var et = /* @__PURE__ */ new u8(0);
  var b2 = function(d, b) {
    return d[b] | d[b + 1] << 8;
  };
  var b4 = function(d, b) {
    return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
  };
  var b8 = function(d, b) {
    return b4(d, b) + b4(d, b + 4) * 4294967296;
  };
  function inflateSync(data, opts) {
    return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
  }
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }
  var dutf8 = function(d) {
    for (var r = "", i2 = 0; ; ) {
      var c = d[i2++];
      var eb = (c > 127) + (c > 223) + (c > 239);
      if (i2 + eb > d.length)
        return { s: r, r: slc(d, i2 - 1) };
      if (!eb)
        r += String.fromCharCode(c);
      else if (eb == 3) {
        c = ((c & 15) << 18 | (d[i2++] & 63) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
      } else if (eb & 1)
        r += String.fromCharCode((c & 31) << 6 | d[i2++] & 63);
      else
        r += String.fromCharCode((c & 15) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63);
    }
  };
  function strFromU8(dat, latin1) {
    if (latin1) {
      var r = "";
      for (var i2 = 0; i2 < dat.length; i2 += 16384)
        r += String.fromCharCode.apply(null, dat.subarray(i2, i2 + 16384));
      return r;
    } else if (td) {
      return td.decode(dat);
    } else {
      var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
      if (r.length)
        err(8);
      return s;
    }
  }
  var slzh = function(d, b) {
    return b + 30 + b2(d, b + 26) + b2(d, b + 28);
  };
  var zh = function(d, b, z) {
    var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
    var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
    return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
  };
  var z64hs = function(d, b, l, z, sc, su, off) {
    var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
    var nf = nsc + nsu + noff;
    if (z && nf) {
      for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
        if (b2(d, b) == 1) {
          return [
            nsc ? b8(d, b + 4 + 8 * nsu) : sc,
            nsu ? b8(d, b + 4) : su,
            noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
            1
          ];
        }
      }
      if (z < 2)
        err(13);
    }
    return [sc, su, off, 0];
  };
  function unzipSync(data, opts) {
    var files = {};
    var e = data.length - 22;
    for (; b4(data, e) != 101010256; --e) {
      if (!e || data.length - e > 65558)
        err(13);
    }
    ;
    var c = b2(data, e + 8);
    if (!c)
      return {};
    var o = b4(data, e + 16);
    var z = b4(data, e - 20) == 117853008;
    if (z) {
      var ze = b4(data, e - 12);
      z = b4(data, ze) == 101075792;
      if (z) {
        c = b4(data, ze + 32);
        o = b4(data, ze + 48);
      }
    }
    var fltr = opts && opts.filter;
    for (var i2 = 0; i2 < c; ++i2) {
      var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
      o = no;
      if (!fltr || fltr({
        name: fn,
        size: sc,
        originalSize: su,
        compression: c_2
      })) {
        if (!c_2)
          files[fn] = slc(data, b, b + sc);
        else if (c_2 == 8)
          files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
        else
          err(14, "unknown compression type " + c_2);
      }
    }
    return files;
  }

  // site-work/js/pixel-import.js
  var import_gifuct_js = __toESM(require_lib2());
  var IMPORT_LIMITS = { bytes: 25 * 1024 * 1024, dimension: 512, frames: 256, pixels: 16e6 };
  var imageName = /\.(png|jpe?g|webp|gif)$/i;
  var natural = new Intl.Collator(void 0, { numeric: true, sensitivity: "base" });
  function validateImport(width, height, count = 1) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > IMPORT_LIMITS.dimension || height > IMPORT_LIMITS.dimension)
      throw Error("Use artwork from 1 to 512 pixels on each side.");
    if (count > IMPORT_LIMITS.frames || width * height * count > IMPORT_LIMITS.pixels)
      throw Error("This animation is too large. Use up to 256 frames and 16 million pixels in total.");
  }
  function rgbaToPixels(bytes) {
    const out = new Uint32Array(bytes.length / 4);
    for (let i2 = 0; i2 < out.length; i2++) out[i2] = (bytes[i2 * 4] << 24 | bytes[i2 * 4 + 1] << 16 | bytes[i2 * 4 + 2] << 8 | bytes[i2 * 4 + 3]) >>> 0;
    return out;
  }
  function groupEntries(entries) {
    const images = entries.filter((e) => imageName.test(e.name) && !/(^|\/)(?:__MACOSX|\._)/.test(e.name));
    const animations = images.filter((e) => /(^|\/)animations\//i.test(e.name));
    const selected = animations.length ? animations : images;
    const groups = /* @__PURE__ */ new Map();
    for (const entry of selected) {
      const directory = entry.name.includes("/") ? entry.name.slice(0, entry.name.lastIndexOf("/")) : "";
      if (!groups.has(directory)) groups.set(directory, []);
      groups.get(directory).push(entry);
    }
    return [...groups].sort(([a], [b]) => natural.compare(a, b)).map(([path, files]) => ({
      name: (path.split("/").slice(-2).join(" / ") || "Imported images").replace(/[_-]/g, " "),
      entries: files.sort((a, b) => natural.compare(a.name, b.name))
    }));
  }
  async function readImportGroups(files) {
    if (files.reduce((sum, f) => sum + f.size, 0) > IMPORT_LIMITS.bytes) throw Error("Choose up to 25 MB of sprite files at a time.");
    const entries = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (/\.zip$/i.test(file.name)) {
        let total = 0;
        const archive = unzipSync(bytes, { filter: (item) => {
          if (!imageName.test(item.name) || /(^|\/)(?:__MACOSX|\._)/.test(item.name)) return false;
          total += item.originalSize;
          if (total > 64 * 1024 * 1024) throw Error("The extracted images exceed 64 MB. Import a smaller pack.");
          return true;
        } });
        for (const [name, data] of Object.entries(archive)) entries.push({ name, bytes: data });
      } else if (imageName.test(file.name)) entries.push({ name: file.name, bytes });
    }
    const groups = groupEntries(entries);
    if (!groups.length) throw Error("No PNG, JPEG, WebP or GIF images found in those files.");
    return groups;
  }
  function decodeGif(bytes) {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const parsed = (0, import_gifuct_js.parseGIF)(buffer), width = parsed.lsd.width, height = parsed.lsd.height;
    validateImport(width, height, parsed.frames.filter((f) => f.image).length);
    const decoded = (0, import_gifuct_js.decompressFrames)(parsed, true), canvas = new Uint8ClampedArray(width * height * 4), frames = [];
    let previous, restore;
    for (const frame of decoded) {
      if (previous?.disposalType === 2) {
        const d2 = previous.dims;
        for (let y = d2.top; y < Math.min(height, d2.top + d2.height); y++)
          for (let x2 = d2.left; x2 < Math.min(width, d2.left + d2.width); x2++) canvas.fill(0, (y * width + x2) * 4, (y * width + x2 + 1) * 4);
      } else if (previous?.disposalType === 3 && restore) canvas.set(restore);
      restore = frame.disposalType === 3 ? canvas.slice() : null;
      const d = frame.dims;
      for (let y = 0; y < d.height; y++) for (let x2 = 0; x2 < d.width; x2++) {
        const from = (y * d.width + x2) * 4, tx = d.left + x2, ty = d.top + y;
        if (tx >= width || ty >= height || !frame.patch[from + 3]) continue;
        canvas.set(frame.patch.subarray(from, from + 4), (ty * width + tx) * 4);
      }
      frames.push({ width, height, pixels: rgbaToPixels(canvas), duration: Math.max(20, frame.delay || 100) });
      previous = frame;
    }
    if (!frames.length) throw Error("This GIF has no readable image frames.");
    return frames;
  }
  async function decodeStill(entry) {
    const blob = new Blob([entry.bytes]);
    let image, url;
    try {
      if (typeof createImageBitmap === "function") image = await createImageBitmap(blob);
      else {
        url = URL.createObjectURL(blob);
        image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(Error("Unsupported image: " + entry.name));
          img.src = url;
        });
      }
      validateImport(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      return [{ width: image.width, height: image.height, pixels: rgbaToPixels(ctx.getImageData(0, 0, image.width, image.height).data), duration: 125 }];
    } finally {
      image?.close?.();
      if (url) URL.revokeObjectURL(url);
    }
  }
  async function decodeGroup(group) {
    if (group.entries.length > IMPORT_LIMITS.frames) throw Error("Choose an animation with up to 256 images.");
    const decoded = [];
    for (const entry of group.entries) {
      const result = /\.gif$/i.test(entry.name) ? decodeGif(entry.bytes) : await decodeStill(entry);
      decoded.push(...result);
      validateImport(Math.max(...decoded.map((f) => f.width)), Math.max(...decoded.map((f) => f.height)), decoded.length);
    }
    return assembleFrames(decoded);
  }
  function assembleFrames(decoded) {
    if (!decoded.length) throw Error("No readable frames found.");
    const width = Math.max(...decoded.map((f) => f.width)), height = Math.max(...decoded.map((f) => f.height));
    validateImport(width, height, decoded.length);
    return { width, height, frames: decoded.map((frame) => {
      const pixels = new Uint32Array(width * height), left = Math.floor((width - frame.width) / 2), top = Math.floor((height - frame.height) / 2);
      for (let y = 0; y < frame.height; y++) pixels.set(frame.pixels.subarray(y * frame.width, (y + 1) * frame.width), (y + top) * width + left);
      return { pixels, duration: frame.duration };
    }) };
  }

  // site-work/js/pixel-studio-source.js
  (() => {
    const $ = (id) => document.getElementById(id), canvas = $("pixel-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let size = 32, height = 32, frames = [], current = 0, layer = 0, tool = "pencil", grid = true, playing = null, drawing = false;
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
      const p = point(hoverPoint), bounds = pixelBrushBounds(p.x, p.y, size, +$("pixel-brush").value, height);
      brushPreview.hidden = false;
      brushPreview.dataset.mode = tool;
      brushPreview.style.left = rect.left - parent.left - shell.clientLeft + shell.scrollLeft + bounds.left * rect.width / size + "px";
      brushPreview.style.top = rect.top - parent.top - shell.clientTop + shell.scrollTop + bounds.top * rect.height / height + "px";
      brushPreview.style.width = (bounds.right - bounds.left) * rect.width / size + "px";
      brushPreview.style.height = (bounds.bottom - bounds.top) * rect.height / height + "px";
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
      ["red", "green", "blue"].forEach((name, i2) => {
        const value = parseInt(hex.slice(1 + i2 * 2, 3 + i2 * 2), 16);
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
        for (let i2 = 0; i2 < pixels.length; i2++) {
          const front = rgba(pixels[i2]), alpha = front[3] / 255;
          const mix = back.map((v, c) => Math.round(front[c] * alpha + v * (1 - alpha)));
          pixels[i2] = (mix[0] << 24 | mix[1] << 16 | mix[2] << 8 | 255) >>> 0;
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
      return { name, visible: true, pixels: new Uint32Array(size * height) };
    }
    function freshFrame() {
      return { duration: 1e3 / +$("pixel-fps").value, layers: frames[0]?.layers.map((x2) => freshLayer(x2.name)) || [freshLayer()] };
    }
    function copyFrame(frame) {
      return { duration: frame.duration, layers: frame.layers.map((x2) => ({ name: x2.name, visible: x2.visible, pixels: new Uint32Array(x2.pixels) })) };
    }
    function setDimensions(w, h = w) {
      size = w;
      height = h;
      const cell = Math.max(1, Math.floor(512 / Math.max(w, h)));
      canvas.width = w * cell;
      canvas.height = h * cell;
      canvas.style.width = canvas.width + "px";
      canvas.style.maxWidth = "100%";
      $("pixel-zoom").value = 100;
      $("pixel-zoom-value").value = "100%";
      [...$("pixel-size").options].filter((o) => o.value === "imported").forEach((o) => o.remove());
      let option = [...$("pixel-size").options].find((o) => +o.value === w && w === h);
      if (!option) {
        option = document.createElement("option");
        option.value = "imported";
        option.textContent = `Imported ${w} \xD7 ${h}`;
        $("pixel-size").append(option);
      }
      $("pixel-size").value = option.value;
    }
    function init(n = 32, h = n) {
      stop();
      setDimensions(n, h);
      frames = [{ duration: 125, layers: [freshLayer()] }];
      current = 0;
      layer = 0;
      history = [];
      update();
    }
    function rgba(n) {
      return [n >>> 24 & 255, n >>> 16 & 255, n >>> 8 & 255, n & 255];
    }
    function composite(frame) {
      const out = new Uint32Array(size * height);
      for (const item of frame.layers) if (item.visible) for (let i2 = 0; i2 < out.length; i2++) {
        const front = item.pixels[i2], alpha = (front & 255) / 255;
        if (!alpha) continue;
        if (alpha === 1 || !(out[i2] & 255)) {
          out[i2] = front;
          continue;
        }
        const f = rgba(front), back = rgba(out[i2]), ba = back[3] / 255, a = alpha + ba * (1 - alpha);
        const c = [0, 1, 2].map((j) => Math.round((f[j] * alpha + back[j] * ba * (1 - alpha)) / a));
        out[i2] = (c[0] << 24 | c[1] << 16 | c[2] << 8 | Math.round(a * 255)) >>> 0;
      }
      return out;
    }
    function draw() {
      const cell = canvas.width / size;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = backgroundColour();
      $("pixel-canvas-shell").style.backgroundColor = bg || "#cbd3e0";
      if (bg) {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if ($("pixel-onion").checked && current > 0 && !playing) {
        const back = composite(frames[current - 1]);
        for (let i2 = 0; i2 < back.length; i2++) if (back[i2] & 255) {
          const c = rgba(back[i2]);
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.22)`;
          ctx.fillRect(i2 % size * cell, Math.floor(i2 / size) * cell, cell, cell);
        }
      }
      const data = composite(frames[current]);
      for (let i2 = 0; i2 < data.length; i2++) if (data[i2] & 255) {
        const c = rgba(data[i2]);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${c[3] / 255})`;
        ctx.fillRect(i2 % size * cell, Math.floor(i2 / size) * cell, cell, cell);
      }
      if (grid && !playing) {
        ctx.beginPath();
        for (let i2 = 0; i2 <= Math.max(size, height); i2++) {
          const p = i2 * cell + 0.5;
          if (i2 <= size) {
            ctx.moveTo(p, 0);
            ctx.lineTo(p, canvas.height);
          }
          if (i2 <= height) {
            ctx.moveTo(0, p);
            ctx.lineTo(canvas.width, p);
          }
        }
        ctx.strokeStyle = `rgba(0,0,0,${+$("pixel-grid-opacity").value / 100})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      updateBrushPreview();
      $("pixel-info").textContent = `${size} \xD7 ${height} \xB7 frame ${current + 1}/${frames.length} \xB7 ${frames[current].layers[layer].name}`;
    }
    function renderLists() {
      $("pixel-layers").replaceChildren();
      frames[current].layers.forEach((item, i2) => {
        const row = document.createElement("div");
        row.className = "pixel-list-row" + (i2 === layer ? " is-active" : "");
        const select = document.createElement("button");
        select.type = "button";
        select.textContent = item.name;
        select.addEventListener("click", () => {
          layer = i2;
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
      frames.forEach((frame, i2) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = i2 === current ? "is-active" : "";
        const thumb = document.createElement("canvas");
        thumb.width = size;
        thumb.height = height;
        thumb.getContext("2d").putImageData(new ImageData(pixelsToRGBA(composite(frame)), size, height), 0, 0);
        const number = document.createElement("span");
        number.textContent = String(i2 + 1).padStart(2, "0");
        b.append(thumb, number);
        b.setAttribute("aria-label", `Frame ${i2 + 1}, ${Math.round(frame.duration || 125)} milliseconds`);
        b.addEventListener("click", () => {
          stop();
          current = i2;
          layer = Math.min(layer, frames[i2].layers.length - 1);
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
      return { x: Math.min(size - 1, Math.max(0, Math.floor((e.clientX - rect.left) / rect.width * size))), y: Math.min(height - 1, Math.max(0, Math.floor((e.clientY - rect.top) / rect.height * height))) };
    }
    function paint(x2, y) {
      const arr = frames[current].layers[layer].pixels, bounds = pixelBrushBounds(x2, y, size, +$("pixel-brush").value, height);
      for (let py = bounds.top; py < bounds.bottom; py++) for (let px = bounds.left; px < bounds.right; px++) arr[py * size + px] = tool === "eraser" ? 0 : colour;
      draw();
    }
    function line(a, b) {
      const steps = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
      for (let i2 = 0; i2 <= steps; i2++) paint(Math.round(a.x + (b.x - a.x) * i2 / steps), Math.round(a.y + (b.y - a.y) * i2 / steps));
    }
    function flood(x2, y) {
      const arr = frames[current].layers[layer].pixels, old = arr[y * size + x2], value = colour;
      if (old === value) return;
      checkpoint();
      const stack = [y * size + x2];
      while (stack.length) {
        const i2 = stack.pop();
        if (arr[i2] !== old) continue;
        arr[i2] = value;
        const px = i2 % size, py = Math.floor(i2 / size);
        if (px > 0) stack.push(i2 - 1);
        if (px < size - 1) stack.push(i2 + 1);
        if (py > 0) stack.push(i2 - size);
        if (py < height - 1) stack.push(i2 + size);
      }
      draw();
    }
    function pick(x2, y) {
      const val = composite(frames[current])[y * size + x2];
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
      document.querySelectorAll("[data-pixel-tool]").forEach((x2) => x2.classList.toggle("is-active", x2 === b));
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
      frames.forEach((f) => f.duration = 1e3 / +e.target.value);
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
      init(Number.isFinite(+$("pixel-size").value) ? +$("pixel-size").value : size, Number.isFinite(+$("pixel-size").value) ? +$("pixel-size").value : height);
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
      history = [];
      frames.splice(current + 1, 0, freshFrame());
      current++;
      update();
    });
    $("pixel-duplicate-frame").addEventListener("click", () => {
      stop();
      history = [];
      frames.splice(current + 1, 0, copyFrame(frames[current]));
      current++;
      update();
    });
    $("pixel-delete-frame").addEventListener("click", () => {
      if (frames.length === 1) return;
      stop();
      history = [];
      frames.splice(current, 1);
      current = Math.min(current, frames.length - 1);
      layer = Math.min(layer, frames[current].layers.length - 1);
      update();
    });
    function stop() {
      if (playing) {
        clearTimeout(playing);
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
      function advance() {
        current = (current + 1) % frames.length;
        draw();
        highlightFrame();
        playing = setTimeout(advance, frames[current].duration || 125);
      }
      playing = setTimeout(advance, frames[current].duration || 125);
      $("pixel-play").textContent = "Stop";
      draw();
    }
    function highlightFrame() {
      [...$("pixel-frames").children].forEach((b, i2) => b.classList.toggle("is-active", i2 === current));
    }
    $("pixel-play").addEventListener("click", () => playing ? stop() : play());
    function pixelsToRGBA(pixels) {
      const out = new Uint8ClampedArray(size * height * 4);
      for (let i2 = 0; i2 < pixels.length; i2++) {
        const c = rgba(pixels[i2]);
        out.set(c, i2 * 4);
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
      temp.height = height;
      temp.getContext("2d").putImageData(new ImageData(pixelsToRGBA(exportComposite(frames[current])), size, height), 0, 0);
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
        const merged = exportComposite(frame), indexed = new Uint8Array(size * height);
        for (let i2 = 0; i2 < merged.length; i2++) {
          const c = merged[i2];
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
          indexed[i2] = index;
        }
        gif.writeFrame(indexed, size, height, { palette, transparent: true, transparentIndex: 0, delay: Math.round(frame.duration || 1e3 / +$("pixel-fps").value), repeat: 0, dispose: 2 });
      }
      gif.finish();
      save(new Blob([gif.bytes()], { type: "image/gif" }), "bootleg-pixel-animation.gif");
      $("pixel-status").textContent = `Exported ${frames.length} frame${frames.length === 1 ? "" : "s"} as GIF.`;
    });
    let importGroups = [], busy = false;
    const hasArt = () => frames.some((f) => f.layers.some((l) => l.pixels.some(Boolean)));
    async function importSelection() {
      if (busy || !importGroups.length) return;
      const group = importGroups[+$("pixel-import-group").value || 0];
      if (hasArt() && !confirm("Replace the current drawing with this import? Download your work first if you want to keep it.")) return;
      busy = true;
      $("pixel-import-load").disabled = true;
      $("pixel-status").textContent = "Reading sprite frames\u2026";
      try {
        const result = await decodeGroup(group);
        stop();
        setDimensions(result.width, result.height);
        frames = result.frames.map((f) => ({ duration: f.duration, layers: [{ name: "Imported artwork", visible: true, pixels: f.pixels }] }));
        current = 0;
        layer = 0;
        history = [];
        $("pixel-background").value = "transparent";
        $("pixel-background-colour").hidden = true;
        const fps = Math.min(60, Math.max(1, Math.round(1e3 / frames[0].duration)));
        $("pixel-fps").value = fps;
        $("pixel-fps-value").value = fps;
        update();
        $("pixel-status").textContent = `Imported ${frames.length} frame${frames.length === 1 ? "" : "s"} at ${size} \xD7 ${height}, keeping original pixels and transparency.`;
      } catch (error) {
        $("pixel-status").textContent = "Import failed: " + error.message;
      } finally {
        busy = false;
        $("pixel-import-load").disabled = false;
      }
    }
    async function importFiles(files) {
      if (busy || !files.length) return;
      busy = true;
      $("pixel-status").textContent = "Opening files locally\u2026";
      try {
        const groups = await readImportGroups([...files]);
        importGroups = groups;
        $("pixel-import-group").replaceChildren();
        groups.forEach((g, i2) => {
          const o = document.createElement("option");
          o.value = i2;
          o.textContent = g.name + ` (${g.entries.length} file${g.entries.length === 1 ? "" : "s"})`;
          $("pixel-import-group").append(o);
        });
        $("pixel-import-choice").hidden = groups.length === 1;
        busy = false;
        if (groups.length === 1) await importSelection();
        else $("pixel-status").textContent = `Found ${groups.length} image groups. Choose an animation, then press Load frames. Animation folders take priority over rotation poses.`;
      } catch (error) {
        $("pixel-status").textContent = "Import failed: " + error.message;
      } finally {
        busy = false;
        $("pixel-import").value = "";
      }
    }
    $("pixel-import").addEventListener("change", (e) => importFiles(e.target.files));
    $("pixel-import-load").addEventListener("click", importSelection);
    shell.addEventListener("dragover", (e) => {
      e.preventDefault();
      shell.classList.add("is-dragging");
    });
    shell.addEventListener("dragleave", () => shell.classList.remove("is-dragging"));
    shell.addEventListener("drop", (e) => {
      e.preventDefault();
      shell.classList.remove("is-dragging");
      importFiles(e.dataTransfer.files);
    });
    $("pixel-zoom").addEventListener("input", (e) => {
      $("pixel-zoom-value").value = e.target.value + "%";
      canvas.style.width = canvas.width * +e.target.value / 100 + "px";
      canvas.style.maxWidth = +e.target.value <= 100 ? "100%" : "none";
      updateBrushPreview();
    });
    init();
  })();
})();
