<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from "vue";
import type { PokemonDetail } from "./types/pokemon";
import PokemonCard from "./components/PokemonCard.vue";

const pokemonList = ref<PokemonDetail[]>([]);
const searchTerm = ref<string>("");
const isLoading = ref<boolean>(false);
const isSearching = ref<boolean>(false);
const initialFetchDone = ref<boolean>(false);
const pokemonGridRef = ref<HTMLElement | null>(null);

const fetchInitialPokemon = async () => {
  isLoading.value = true;
  const apiUrl = "https://pokeapi.co/api/v2/pokemon?limit=100";

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const detailedFetches = data.results.map(
      async (pokemon: { url: string }) => {
        const detailResponse = await fetch(pokemon.url);
        const detailData = (await detailResponse.json()) as PokemonDetail;

        const speciesResponse = await fetch(detailData.species.url);
        const speciesData = await speciesResponse.json();

        const flavorTextEntry = speciesData.flavor_text_entries.find(
          (entry: any) => entry.language.name === "en"
        );

        detailData.description = flavorTextEntry
          ? flavorTextEntry.flavor_text.replace(/[\n\f]/g, " ")
          : "Descrição não disponível.";

        return detailData;
      }
    );

    pokemonList.value = await Promise.all(detailedFetches);
  } catch (error) {
    console.error("Erro ao carregar lista inicial:", error);
  } finally {
    isLoading.value = false;
    initialFetchDone.value = true;
  }
};

onMounted(fetchInitialPokemon);

const locallyFilteredList = computed(() => {
  if (!searchTerm.value) {
    return pokemonList.value;
  }

  const term = searchTerm.value.toLowerCase().trim();

  return pokemonList.value.filter((pokemon) => {
    const nameMatch = pokemon.name.includes(term);
    const idMatch = String(pokemon.id) === term;
    return nameMatch || idMatch;
  });
});

const scrollToFirstItem = () => {
  if (pokemonGridRef.value) {
    nextTick(() => {
      if (pokemonGridRef.value) {
        pokemonGridRef.value.scrollLeft = 0;
      }
    });
  }
};

const searchExternally = async () => {
  const term = searchTerm.value.toLowerCase().trim();
  if (!term) return;

  if (locallyFilteredList.value.length > 0) {
    return;
  }

  isSearching.value = true;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${term}`);

    if (!response.ok) {
      if (response.status === 404) {
        alert(`O Pokémon "${term}" não foi encontrado (Busca Externa).`);
      }
      return;
    }

    const data = await response.json();
    pokemonList.value.push(data as PokemonDetail);
  } catch (error) {
    console.error("Erro na busca externa:", error);
  } finally {
    isSearching.value = false;
  }
};

const scroll = (direction: "up" | "down" | "left" | "right") => {
  const container = pokemonGridRef.value;

  if (!container) {
    console.error("Container de scroll não encontrado!");
    return;
  }

  if (direction === "left" || direction === "right") {
    const amount = container.clientWidth * (direction === "left" ? -1 : 1);

    container.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  }

  const allCards = container.querySelectorAll("li");
  if (allCards.length === 0) return;

  const cardWidth = container.clientWidth;
  const currentScrollLeft = container.scrollLeft;
  const activeCardIndex = Math.round(currentScrollLeft / cardWidth);
  const activeCardLi = allCards[activeCardIndex] as HTMLElement;
  const innerScrollContainer = activeCardLi.querySelector(
    ".pokemon-card-content"
  ) as HTMLElement | null;

  if (!innerScrollContainer) {
    console.warn("Container de scroll interno não encontrado!");
    return;
  }

  const amount = innerScrollContainer.clientHeight;
  const scrollValue = direction === "down" ? amount : -amount;

  innerScrollContainer.scrollBy({
    top: scrollValue,
    behavior: "smooth",
  });
};
</script>

<template>
  <div class="container">
    <div id="pokedex">
      <div id="buttons-header">
        <button id="button-principal"></button>
        <div class="buttons">
          <button class="button red"></button>
          <button class="button yellow"></button>
          <button class="button green"></button>
        </div>
      </div>
      <div id="display">
        <div id="circle-container">
          <span class="circle"></span>
          <span class="circle"></span>
        </div>
        <ul
          class="pokemon-grid"
          v-if="locallyFilteredList.length > 0"
          ref="pokemonGridRef"
        >
          <PokemonCard
            v-for="pokemon in locallyFilteredList"
            :key="pokemon.id"
            :pokemon="pokemon"
          />
        </ul>
        <div
          class="pokemon-grid default"
          v-else-if="searchTerm && !isSearching && initialFetchDone"
        >
          <p>Nenhum Pokémon encontrado nos primeiros 100.</p>
          <p>
            Pressione o botão "<span class="color-blue">Azul</span>" ou Enter
            para pesquisar na API completa.
          </p>
        </div>
        <div class="pokemon-grid default" v-else-if="isLoading">
          <p>Carregando os primeiros 100 Pokémon...</p>
        </div>
        <div class="pokemon-grid default" v-else-if="isSearching">
          <p>Buscando Pokémon...</p>
        </div>
        <div id="container-stuff">
          <div id="red-circle"></div>
          <div id="container-bar">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </div>
        </div>
      </div>
      <div id="navigations">
        <div class="search-controls">
          <div class="buttons">
            <button
              class="reset-button"
              type="button"
              @click="searchTerm = ''"
            ></button>
            <button
              @click="searchExternally"
              :disabled="
                isSearching ||
                !initialFetchDone ||
                locallyFilteredList.length > 0
              "
              class="search-button"
              type="button"
            ></button>
          </div>
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Nome ou ID..."
            class="search-input"
            @keyup.enter="searchExternally"
            @input="scrollToFirstItem"
          />
        </div>
        <div id="joystick">
          <button
            type="button"
            class="button"
            id="button-up"
            @click="scroll('up')"
          ></button>
          <button
            type="button"
            class="button"
            id="button-left"
            @click="scroll('left')"
          ></button>
          <button
            type="button"
            class="button"
            id="button-right"
            @click="scroll('right')"
          ></button>
          <button
            type="button"
            class="button"
            id="button-down"
            @click="scroll('down')"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Playwrite+NZ+Guides&display=swap");

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

::-webkit-scrollbar {
  display: none;
  width: 0px;
}

body {
  margin-inline: 0.5rem;
}

body,
#app,
input,
button {
  font-family: "Pixelify Sans", sans-serif;
  font-optical-sizing: auto;
}

.color-blue {
  color: #02a79f;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 0 0 0 1rem;
}

#pokedex {
  width: 100%;
  max-width: 400px;
  border: 6px solid #111;
  border-radius: 1.5rem;
  background-color: #d2222a;
  overflow: hidden;
  box-shadow: -8px 8px 0 0px #79171b, -8px 8px 0 8px #111;

  position: relative;
  z-index: 1;

  #display {
    margin: 1rem 1.25rem 1.5rem 1.5rem;
    padding: 0.25rem 1rem 1rem;
    background-color: #f2f2f2;
    border-radius: 1rem;
    border: 3px solid #111;
    box-shadow: -3px 3px 0 0px #7a8380, -3px 3px 0 2px #111;

    #circle-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.25rem;

      .circle {
        width: 0.5rem;
        aspect-ratio: 1;
        background-color: #d2222a;
        border-radius: 50%;
      }
    }

    #container-stuff {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.5rem;

      #red-circle {
        width: 2rem;
        aspect-ratio: 1;
        background-color: #d2222a;
        border-radius: 50%;
        border: 3px solid #111;
      }

      #container-bar {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .bar {
          width: 4rem;
          background-color: #111;
          height: 0.25rem;
          border-radius: 0.5rem;
        }
      }
    }
  }

  .pokemon-grid {
    padding: 0;
    margin: 0;
    width: 100%;
    aspect-ratio: 1;
    overflow-x: auto;
    display: flex;
    scroll-behavior: smooth;
    scroll-snap-type: x mandatory;
    box-sizing: border-box;
    border: 6px solid #adadad;
    z-index: 1;

    &.default {
      background-color: #57595b;
      flex-direction: column;
      justify-content: center;
      padding: 1rem;
      gap: 0.5rem;
      font-weight: bold;
    }

    .pokemon-card {
      width: 100%;
      flex: 0 0 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      text-align: center;
      scroll-snap-align: center;
    }
  }
}

#buttons-header {
  display: flex;
  align-items: start;
  padding: 0.5rem 0.5rem 1.1875rem;
  border-bottom: 3px solid #111;
  position: relative;
  overflow: hidden;
  gap: 0.5rem;
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0.5rem;
    background-color: #a51c22;
    border-top: 3px solid #111;
  }

  #button-principal {
    width: 4rem;
    border-radius: 50%;
    aspect-ratio: 1;
    background-color: #fff;
    border: 3px solid #111;
    position: relative;
    cursor: pointer;
    z-index: 1;

    &::before {
      content: "";
      width: 2.8rem;
      border-radius: 50%;
      aspect-ratio: 1;
      position: absolute;
      border: 3px solid #111;
      background-color: #00adec;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .buttons {
    display: flex;
    align-items: start;
    gap: 0.5rem;

    .button {
      width: 1.5rem;
      aspect-ratio: 1;
      border-radius: 50%;
      border: 3px solid #111;
      background-color: #fff;
      cursor: pointer;

      &.red {
        background-color: #ff0000;
      }

      &.yellow {
        background-color: #ffff00;
      }

      &.green {
        background-color: #00ff00;
      }
    }
  }
}

#navigations {
  display: flex;
  justify-content: space-evenly;
  padding-bottom: 1.5rem;

  #joystick {
    width: 5.4rem;
    aspect-ratio: 1;
    position: relative;

    &::after {
      width: 1.6rem;
      aspect-ratio: 1;
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #474747;
      border-radius: 0.25rem;
    }

    &::before {
      width: 1.25rem;
      aspect-ratio: 1;
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #474747;
      border-radius: 50%;
      border: 3px solid #111;
      z-index: 1;
    }

    .button {
      background-color: #474747;
      display: flex;
      border: 0;
      cursor: pointer;
      position: absolute;
    }

    .button:hover {
      background-color: #414141;
    }

    #button-right {
      top: 50%;
      transform: translateY(-50%);
      right: 0;
      content: "";
      width: 2rem;
      height: 1.8rem;
      border-right: 3px solid #111;
      border-top: 3px solid #111;
      border-bottom: 3px solid #111;
      box-shadow: -2px 3px 0 0 #111;
      border-radius: 0 6px 6px 0;
    }

    #button-left {
      top: 50%;
      transform: translateY(-50%);
      left: 0;
      content: "";
      width: 2rem;
      height: 1.8rem;
      border-left: 3px solid #111;
      border-top: 3px solid #111;
      border-bottom: 3px solid #111;
      box-shadow: -2px 3px 0 0 #111;
      border-radius: 6px 0 0 6px;
    }

    #button-up {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      content: "";
      width: 1.8rem;
      height: 2rem;
      border-left: 3px solid #111;
      border-top: 3px solid #111;
      border-right: 3px solid #111;
      box-shadow: -2px 3px 0 0 #111;
      border-radius: 6px 6px 0 0;
    }

    #button-down {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      content: "";
      width: 1.8rem;
      height: 2rem;
      border-left: 3px solid #111;
      border-bottom: 3px solid #111;
      border-right: 3px solid #111;
      box-shadow: -2px 3px 0 0 #111;
      border-radius: 0 0 6px 6px;
    }

    /* &::after {
      content: "";
      width: 1rem;
      aspect-ratio: 1;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      border: 3px solid #111;
    } */
  }

  .search-controls {
    display: flex;
    align-items: center;
    flex-direction: column;

    .buttons {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      margin-bottom: 1rem;

      .reset-button,
      .search-button {
        width: 100%;
        height: 1rem;
        border: 3px solid #111;
        border-radius: 1rem;
        cursor: pointer;
      }

      .reset-button {
        background: #a51c22;
      }

      .search-button {
        background: #02a79f;
      }
    }

    input {
      width: 100%;
      background-color: #39b549;
      border: 3px solid #111;
      border-radius: 1rem;
      padding: 1rem;
      color: #fff;
      font-weight: bold;
      outline: none;

      &::placeholder {
        color: #fff;
      }
    }
  }
}
</style>
