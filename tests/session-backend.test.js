const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function cargarScriptsEnContexto() {
  const contexto = {
    console,
    crypto: { randomUUID: () => 'test-uuid-1' },
    localStorage: {
      store: {},
      getItem(key) { return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    }
  };

  contexto.window = contexto;
  const localStorageScript = fs.readFileSync(path.join(__dirname, '../js/shared/local-storage.js'), 'utf8');
  const usuariosStorageScript = fs.readFileSync(path.join(__dirname, '../js/shared/usuarios-storage.js'), 'utf8');

  const vm = require('node:vm');
  vm.runInNewContext(localStorageScript, contexto);
  vm.runInNewContext(usuariosStorageScript, contexto);
  return contexto;
}

test('guardarSesionUsuario acepta un objeto de sesión y lo devuelve desde obtenerUsuarioRegistrado', () => {
  const contexto = cargarScriptsEnContexto();
  const usuario = {
    id: 42,
    email: 'juan@example.com',
    nombreCompleto: 'Juan Perez'
  };

  contexto.guardarSesionUsuario(usuario);
  const usuarioActual = JSON.parse(JSON.stringify(contexto.obtenerUsuarioRegistrado()));

  assert.deepEqual(usuarioActual, usuario);
});
