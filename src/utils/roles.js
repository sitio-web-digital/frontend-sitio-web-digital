// Una cuenta puede tener más de un rol (ver users.roles en db/init.sql y
// Admin > Usuarios > "Editar roles") — `user.roles` es la lista completa,
// siempre incluye a `user.role` (el principal). Estas son las únicas dos
// preguntas que hace falta hacerle a eso en el frontend; todo lo demás sigue
// leyendo `user.role` (rol principal) para cosas puntuales como a dónde
// entra por defecto al loguearse o qué insignia mostrarle en Admin.

export function hasRole(user, role) {
  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
  return roles.includes(role);
}

// Un vendedor por defecto no arma sus propias páginas (solo las que le
// vincula un developer desde una orden) — a menos que un admin le haya
// sumado el rol 'usuario' desde Admin > Usuarios, caso en el que pasa a
// tener las dos cosas: vende Y arma como cualquier cuenta normal.
export function canBuildOwnSites(user) {
  return hasRole(user, 'usuario') || !hasRole(user, 'vendedor');
}
