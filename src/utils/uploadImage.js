import { apiUploadImage } from '../api/client';

// Sube el archivo al server y devuelve una URL durable — si todavía no hay
// sesión iniciada (ej. el logo del quiz, antes de crear cuenta) no hay dónde
// subirla todavía, así que se guarda como data: URL (base64) en vez de un
// blob: URL.createObjectURL. Los blob: solo viven mientras dure ESA pestaña
// del navegador — se rompen apenas se recarga la página — y el borrador del
// sitio se persiste en localStorage entre recargas (ver siteSchema.js >
// saveSiteToStorage), así que un blob: roto quedaba guardado ahí como si
// fuera válido. Una data: URL sí sobrevive, porque es la imagen posta
// codificada en el string, no una referencia a memoria de esa sesión. Una
// vez que la persona se registre y guarde su sitio, la puede volver a subir
// desde el editor para que quede en S3 en vez de en el propio localStorage.
export async function uploadImage(file) {
  const result = await apiUploadImage(file);
  if (result.ok) return result.url;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(URL.createObjectURL(file));
    reader.readAsDataURL(file);
  });
}
