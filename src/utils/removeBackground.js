// Saca el fondo de un logo automáticamente al subirlo — a diferencia de un
// recorte por color fijo (que se come los contornos oscuros del propio
// logo, ej. el trazo de las letras), esto detecta el fondo por CONECTIVIDAD
// desde el borde de la imagen: solo se vuelve transparente lo que está
// físicamente conectado al marco exterior y es parecido al color de ahí,
// nunca algo oscuro que esté "adentro" del dibujo. Mismo algoritmo que se
// probó a mano (Python/Pillow) para el logo de una página real, portado acá
// para que cualquier developer lo tenga como parte de subir el logo, sin
// depender de ningún servicio ni herramienta externa — corre en el propio
// navegador, nada se manda a ningún lado.
//
// Sin scipy ni ninguna librería de imágenes: flood fill con una cola propia
// (BFS, visita cada píxel una sola vez) + una erosión/dilatación chica antes
// de propagar, para que el flood fill no se filtre por una rendija de 1-2px
// de una sombra o una línea de pastina DENTRO del dibujo y lo agujeree.

const BORDER_THICKNESS = 8;
const HARD_THRESHOLD = 220; // candidato a fondo (conectividad)
const SOFT_LOW = 150; // debajo de esto, siempre transparente
const SOFT_HIGH = HARD_THRESHOLD; // entre LOW y HIGH, transición suave (antialias)
const EROSION_RADIUS = 3;
const ALREADY_TRANSPARENT_ALPHA = 12; // si el borde ya está así de transparente, no hay nada que sacar

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

function isBorder(x, y, w, h) {
  return x < BORDER_THICKNESS || y < BORDER_THICKNESS || x >= w - BORDER_THICKNESS || y >= h - BORDER_THICKNESS;
}

// Una pasada de erosión/dilatación en vecindad de 4 — separado en su propia
// función porque se usa dos veces (para "cortar puentes" antes del flood
// fill, y para devolverle al resultado el borde que esa misma erosión le
// sacó de más).
function morph(mask, w, h, mode, radius) {
  let cur = mask;
  for (let r = 0; r < radius; r++) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (mode === 'erode') {
          let v = cur[p];
          if (v && x > 0) v &= cur[p - 1];
          if (v && x < w - 1) v &= cur[p + 1];
          if (v && y > 0) v &= cur[p - w];
          if (v && y < h - 1) v &= cur[p + w];
          next[p] = v;
        } else {
          let v = cur[p];
          if (!v && x > 0) v |= cur[p - 1];
          if (!v && x < w - 1) v |= cur[p + 1];
          if (!v && y > 0) v |= cur[p - w];
          if (!v && y < h - 1) v |= cur[p + w];
          next[p] = v;
        }
      }
    }
    cur = next;
  }
  return cur;
}

// BFS con una cola propia (array preasignado, sin push/shift) — cada píxel
// se visita una sola vez, así que es O(ancho×alto) sin importar cuán grande
// sea la imagen. Semilla: todo el marco del borde que ya sea candidato.
function floodFillFromBorder(candidate, w, h) {
  const reached = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isBorder(x, y, w, h)) continue;
      const p = y * w + x;
      if (candidate[p] && !reached[p]) {
        reached[p] = 1;
        queue[tail++] = p;
      }
    }
  }

  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) {
      const q = p - 1;
      if (candidate[q] && !reached[q]) {
        reached[q] = 1;
        queue[tail++] = q;
      }
    }
    if (x < w - 1) {
      const q = p + 1;
      if (candidate[q] && !reached[q]) {
        reached[q] = 1;
        queue[tail++] = q;
      }
    }
    if (y > 0) {
      const q = p - w;
      if (candidate[q] && !reached[q]) {
        reached[q] = 1;
        queue[tail++] = q;
      }
    }
    if (y < h - 1) {
      const q = p + w;
      if (candidate[q] && !reached[q]) {
        reached[q] = 1;
        queue[tail++] = q;
      }
    }
  }
  return reached;
}

// Devuelve un File PNG con el fondo sacado, o null si no había nada que
// sacar (la imagen ya viene con transparencia en el borde — ej. alguien que
// SÍ le sacó el fondo con otra herramienta antes de subirla). Nunca tira:
// cualquier error de procesamiento devuelve null y quien llama sube el
// archivo original tal cual, como si esto no existiera.
export async function removeLogoBackground(file) {
  try {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return null; // SVG/GIF: no aplica

    const img = await loadImage(file);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h || w * h > 1200 * 1200) return null; // ya lo cubre validateImageFile, doble resguardo

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data; // Uint8ClampedArray RGBA

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let aSum = 0;
    let opaqueCount = 0;
    let borderCount = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!isBorder(x, y, w, h)) continue;
        borderCount++;
        const i = (y * w + x) * 4;
        aSum += data[i + 3];
        if (data[i + 3] < 10) continue;
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        opaqueCount++;
      }
    }
    if (borderCount === 0 || aSum / borderCount < ALREADY_TRANSPARENT_ALPHA) return null;
    if (opaqueCount === 0) return null;
    const refR = rSum / opaqueCount;
    const refG = gSum / opaqueCount;
    const refB = bSum / opaqueCount;

    const n = w * h;
    const dist = new Float32Array(n);
    const candidate = new Uint8Array(n);
    for (let p = 0; p < n; p++) {
      const i = p * 4;
      const dr = data[i] - refR;
      const dg = data[i + 1] - refG;
      const db = data[i + 2] - refB;
      const d = Math.sqrt(dr * dr + dg * dg + db * db);
      dist[p] = d;
      candidate[p] = d < HARD_THRESHOLD ? 1 : 0;
    }

    // "Apertura" antes de la conectividad: corta puentes finos (sombras,
    // líneas de pastina) para que el flood fill no se filtre hacia adentro
    // del dibujo — ver mismo problema y solución ya probados en Python.
    const candidateEroded = morph(candidate, w, h, 'erode', EROSION_RADIUS);
    const reachedEroded = floodFillFromBorder(candidateEroded, w, h);
    const reachedDilated = morph(reachedEroded, w, h, 'dilate', EROSION_RADIUS);

    let removedAny = false;
    for (let p = 0; p < n; p++) {
      if (!(reachedDilated[p] && candidate[p])) continue;
      const t = Math.max(0, Math.min(1, (dist[p] - SOFT_LOW) / (SOFT_HIGH - SOFT_LOW)));
      const alpha = Math.round(t * 255);
      const i = p * 4;
      if (alpha < data[i + 3]) {
        data[i + 3] = alpha;
        removedAny = true;
      }
    }
    if (!removedAny) return null;

    ctx.putImageData(imageData, 0, 0);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return null;
    const name = file.name.replace(/\.[^.]+$/, '') + '-sin-fondo.png';
    return new File([blob], name, { type: 'image/png' });
  } catch {
    // Cualquier falla acá (imagen rara, canvas sin soporte, lo que sea) no
    // tiene que trabar la subida — se sube el archivo original, como si esta
    // función no existiera.
    return null;
  }
}
