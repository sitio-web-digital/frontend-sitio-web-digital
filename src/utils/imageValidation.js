// Límite de tamaño (MB) y dimensiones (px) de las imágenes que se suben desde
// el editor, según en qué sección van — un logo no necesita lo mismo que una
// foto de galería. Si una imagen no cumple, se avisa y no se sube.
export const IMAGE_LIMITS = {
  logo: { maxMB: 2, maxWidth: 1200, maxHeight: 1200, label: 'el logo' },
  galeria: { maxMB: 6, maxWidth: 3000, maxHeight: 3000, label: 'las fotos de la galería' },
  productos: { maxMB: 5, maxWidth: 2400, maxHeight: 2400, label: 'las fotos de productos' },
  faq: { maxMB: 5, maxWidth: 2400, maxHeight: 2400, label: 'las fotos de esta sección' },
  testimonio: { maxMB: 2, maxWidth: 1000, maxHeight: 1000, label: 'la foto de perfil' },
  equipo: { maxMB: 2, maxWidth: 1200, maxHeight: 1200, label: 'la foto de la persona' },
  marcas: { maxMB: 1, maxWidth: 800, maxHeight: 800, label: 'un logo de cliente' },
  blog: { maxMB: 5, maxWidth: 2400, maxHeight: 2400, label: 'la foto de la novedad' },
  hero: { maxMB: 6, maxWidth: 3000, maxHeight: 3000, label: 'las fotos del hero' },
  soporte: { maxMB: 3, maxWidth: 2400, maxHeight: 2400, label: 'las capturas adjuntas' },
};

// Devuelve `true` si el archivo pasa los límites de esa sección; si no, avisa
// con un `alert` (mock simple, sin librería de toasts) y devuelve `false`.
export function validateImageFile(file, limitKey) {
  const limits = IMAGE_LIMITS[limitKey] || IMAGE_LIMITS.galeria;

  if (file.size > limits.maxMB * 1024 * 1024) {
    window.alert(`Esa imagen pesa demasiado. El máximo para ${limits.label} es ${limits.maxMB}MB.`);
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width > limits.maxWidth || img.height > limits.maxHeight) {
        window.alert(
          `Esa imagen es demasiado grande (${img.width}×${img.height}px). El máximo para ${limits.label} es ${limits.maxWidth}×${limits.maxHeight}px.`
        );
        resolve(false);
        return;
      }
      resolve(true);
    };
    // Si el navegador no puede leer las dimensiones por algún motivo, no
    // bloqueamos la carga solo por eso — ya se validó el peso.
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(true);
    };
    img.src = url;
  });
}

// Filtra una lista de archivos dejando solo los que pasan la validación —
// útil para inputs `multiple`, donde queremos subir los que sí entran y
// avisar por los que no, sin cortar toda la carga.
export async function validateImageFiles(files, limitKey) {
  const ok = [];
  for (const file of files) {
    // eslint-disable-next-line no-await-in-loop
    if (await validateImageFile(file, limitKey)) ok.push(file);
  }
  return ok;
}
