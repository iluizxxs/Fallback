import { openDB } from "idb";

let db;

async function createDB() {
  try {
    db = await openDB('banco', 1, {
      upgrade(db, oldVersion, newVersion, transaction) {
        switch (oldVersion) {
          case 0:
          case 1:
            const store = db.createObjectStore('pessoas', {
              keyPath: 'nome' // Nome será a chave primária
            });
            store.createIndex('id', 'id');
            showResult("Banco de dados criado!");
            break;
        }
      }
    });
    showResult("Banco de dados aberto.");
  } catch (e) {
    showResult("Erro ao criar o banco de dados: " + e.message);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await createDB();

  const inputNome = document.getElementById("inputNome");
  const inputIdade = document.getElementById("inputIdade");

  // Salvar novo registro
  document.getElementById("btnSalvar").addEventListener("click", async () => {
    const nome = inputNome.value.trim();
    const idade = parseInt(inputIdade.value);

    if (!nome) {
      showResult("Por favor, insira um nome.");
      return;
    }
    if (isNaN(idade) || idade <= 0) {
      showResult("Por favor, insira uma idade válida.");
      return;
    }

    try {
      // Verifica se já existe
      const existente = await getPessoa(nome);
      if (existente) {
        showResult(`Pessoa com nome "${nome}" já existe. Use atualizar.`);
        return;
      }
      await addData({ nome, idade });
      showResult(`Dados adicionados: Nome: ${nome}, Idade: ${idade}`);
      clearInputs();
    } catch (error) {
      showResult("Erro ao adicionar dados: " + error.message);
    }
  });

  // Atualizar registro existente
  document.getElementById("btnAtualizar").addEventListener("click", async () => {
    const nome = inputNome.value.trim();
    const idade = parseInt(inputIdade.value);

    if (!nome) {
      showResult("Por favor, insira um nome para atualizar.");
      return;
    }
    if (isNaN(idade) || idade <= 0) {
      showResult("Por favor, insira uma idade válida para atualizar.");
      return;
    }

    try {
      const existente = await getPessoa(nome);
      if (!existente) {
        showResult(`Pessoa com nome "${nome}" não existe. Use salvar.`);
        return;
      }
      await updateData({ nome, idade });
      showResult(`Dados atualizados: Nome: ${nome}, Idade: ${idade}`);
      clearInputs();
    } catch (error) {
      showResult("Erro ao atualizar dados: " + error.message);
    }
  });

  // Remover registro
  document.getElementById("btnRemover").addEventListener("click", async () => {
    const nome = inputNome.value.trim();

    if (!nome) {
      showResult("Por favor, insira o nome para remover.");
      return;
    }

    try {
      const removido = await removeData(nome);
      if (removido) {
        showResult(`Pessoa com nome "${nome}" removida com sucesso.`);
        clearInputs();
      } else {
        showResult(`Nenhuma pessoa encontrada com o nome "${nome}".`);
      }
    } catch (error) {
      showResult("Erro ao remover dados: " + error.message);
    }
  });

  // Listar todos
  document.getElementById("btnListar").addEventListener("click", getData);

  function clearInputs() {
    inputNome.value = "";
    inputIdade.value = "";
  }
});

async function addData(pessoa) {
  const tx = await db.transaction('pessoas', 'readwrite');
  const store = tx.objectStore('pessoas');
  await store.add(pessoa);
  await tx.done;
}

async function updateData(pessoa) {
  const tx = await db.transaction('pessoas', 'readwrite');
  const store = tx.objectStore('pessoas');
  await store.put(pessoa); // put atualiza ou adiciona
  await tx.done;
}

async function removeData(nome) {
  const tx = await db.transaction('pessoas', 'readwrite');
  const store = tx.objectStore('pessoas');

  const pessoa = await store.get(nome);
  if (!pessoa) {
    await tx.done;
    return false;
  }

  await store.delete(nome);
  await tx.done;
  return true;
}

async function getPessoa(nome) {
  const tx = await db.transaction('pessoas', 'readonly');
  const store = tx.objectStore('pessoas');
  const pessoa = await store.get(nome);
  await tx.done;
  return pessoa;
}

async function getData() {
  if (db === undefined) {
    showResult("O banco de dados está fechado");
    return;
  }
  const tx = await db.transaction('pessoas', 'readonly');
  const store = tx.objectStore('pessoas');
  const pessoas = await store.getAll();
  if (pessoas.length > 0) {
    let texto = "Nomes cadastrados:<br>";
    pessoas.forEach(p => {
      texto += `Nome: ${p.nome}, Idade: ${p.idade}<br>`;
    });
    showResult(texto);
  } else {
    showResult("Não há nenhum dado no banco!");
  }
}

function showResult(text) {
  document.querySelector("output").innerHTML = text;
}
