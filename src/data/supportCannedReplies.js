// Respuestas típicas de soporte — un admin las toca en SupportThread.jsx y
// se cargan en el textarea (no se mandan solas, se pueden editar antes de
// enviar). Lista fija a propósito, sin UI para administrarla: son pocas
// frases, se agregan/editan acá directo si hace falta una nueva.
export const SUPPORT_CANNED_REPLIES = [
  {
    label: 'Página publicada',
    text: '¡Hola! Confirmamos que tu página ya está publicada y en línea. Cualquier otra consulta, escribinos por acá.',
  },
  {
    label: 'Cómo cambiar el subdominio',
    text: 'Podés cambiar el subdominio de tu página desde el Panel > Configuración de la página, ahí mismo te avisa si ya está en uso.',
  },
  {
    label: 'Cómo actualizar el medio de pago',
    text: 'Para actualizar el medio de pago de tu suscripción, entrá a tu Panel y volvé a intentar el pago desde ahí — al confirmarse, tu página se vuelve a publicar sola.',
  },
  {
    label: 'Cómo cancelar la suscripción',
    text: 'Podés cancelar tu suscripción cuando quieras desde el Panel, en la fila de tu página tocá "Cancelar". Tu contenido y diseño quedan guardados igual, por si más adelante querés volver a publicarla.',
  },
];
