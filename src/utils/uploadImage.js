import { apiUploadImage } from '../api/client';

// Sube el archivo al server y devuelve una URL durable — si todavía no hay
// sesión iniciada (ej. el logo del quiz, antes de crear cuenta) no hay dónde
// subirla todavía, así que se usa el URL.createObjectURL de siempre como
// respaldo: vale para esa sesión, y una vez que la persona se registre y
// guarde su sitio, lo puede volver a subir desde el editor si hace falta.
export async function uploadImage(file) {
  const result = await apiUploadImage(file);
  return result.ok ? result.url : URL.createObjectURL(file);
}
