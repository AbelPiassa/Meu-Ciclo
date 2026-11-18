import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Sobe a API real (backend/ do Abel) em porta livre e banco SQLite temporário.
// Procura o backend em MEU_CICLO_BACKEND_DIR ou em <raiz do repositório>/backend.
const RAIZ = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export function localizarBackend() {
  const candidato = resolve(process.env.MEU_CICLO_BACKEND_DIR ?? join(RAIZ, "backend"));
  const pronto = existsSync(join(candidato, "src", "server.js")) && existsSync(join(candidato, "node_modules"));
  return pronto ? candidato : null;
}

export function portaLivre() {
  return new Promise((resolver, rejeitar) => {
    const servidor = net.createServer();
    servidor.once("error", rejeitar);
    servidor.listen(0, "127.0.0.1", () => {
      const { port } = servidor.address();
      servidor.close(() => resolver(port));
    });
  });
}

export function criarPastaTemporaria() {
  return mkdtempSync(join(tmpdir(), "meu-ciclo-teste-"));
}

export function removerPasta(pasta) {
  rmSync(pasta, { recursive: true, force: true });
}

export async function iniciarServidor(backendDir, caminhoBanco) {
  const porta = await portaLivre();
  const processo = spawn(process.execPath, ["src/server.js"], {
    cwd: backendDir,
    env: { ...process.env, PORT: String(porta), HOST: "127.0.0.1", DATABASE_PATH: caminhoBanco },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let saida = "";
  processo.stdout.on("data", (parte) => (saida += parte));
  processo.stderr.on("data", (parte) => (saida += parte));

  const urlBase = `http://127.0.0.1:${porta}`;
  const limite = Date.now() + 10000;
  while (Date.now() < limite) {
    if (processo.exitCode !== null) {
      throw new Error(`API encerrou ao iniciar:\n${saida}`);
    }
    try {
      const resposta = await fetch(`${urlBase}/health`);
      if (resposta.ok) {
        return {
          urlApi: `${urlBase}/api`,
          parar: () =>
            new Promise((resolver) => {
              if (processo.exitCode !== null) return resolver();
              processo.once("exit", () => resolver());
              processo.kill("SIGTERM"); // o servidor fecha o banco ao receber SIGTERM
            }),
        };
      }
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  processo.kill("SIGKILL");
  throw new Error(`API não respondeu em 10 s:\n${saida}`);
}
