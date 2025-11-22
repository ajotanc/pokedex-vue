<script setup lang="ts">
import { computed } from "vue";
import type { PokemonDetail, StatEntry } from "../types/pokemon";

interface Props {
  pokemon: PokemonDetail;
}

const props = defineProps<Props>();

const formattedName = computed(() => {
  const name = props.pokemon.name;
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const staticImageUrl = computed(() => {
  return (
    props.pokemon.sprites.other["official-artwork"].front_default ||
    props.pokemon.sprites.front_default
  );
});

const animatedImageUrl = computed(() => {
  const animatedSprite =
    props.pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.animated
      ?.front_default;

  return animatedSprite || staticImageUrl.value;
});

const currentImageUrl = computed(() => {
  return animatedImageUrl.value;
});

const typeNames = computed(() => {
  return props.pokemon.types.map((t) => t.type.name);
});

const pokemonStats = computed(() => {
  return props.pokemon.stats.map((statEntry: StatEntry) => ({
    name: statEntry.stat.name.toUpperCase().replace("-", " "),
    value: statEntry.base_stat,
  }));
});

const audioPlayer = new Audio();

const handlePlaySound = () => {
  if (!props.pokemon.cries || !props.pokemon.cries.latest) {
    console.warn("Nenhum Pokémon ativo ou URL de som indisponível.");
    return;
  }

  const soundUrl = props.pokemon.cries.latest;

  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  audioPlayer.src = soundUrl;

  audioPlayer.play().catch((error) => {
    console.error("Erro ao tentar tocar o som:", error);
  });
};
</script>

<template>
  <li class="pokemon-card" :class="typeNames[0]">
    <span class="pokemon-name"
      ><span class="pokemon-number"
        >Nº {{ props.pokemon.id.toString().padStart(4, "0") }}</span
      >
      {{ formattedName.toUpperCase() }}</span
    >

    <img :src="currentImageUrl" :alt="formattedName" class="pokemon-image" />

    <!-- <div class="stats-list">
      <h4>Stats Base</h4>
      <div v-for="stat in pokemonStats" :key="stat.name" class="stat-item">
        <span class="stat-name"
          >{{ stat.name }}:
          <span class="stat-value">{{ stat.value }}</span></span
        >
      </div>
    </div> -->

    <div class="types">
      <span v-for="type in typeNames" :key="type" :class="['type-badge', type]">
        {{ type.toUpperCase() }}
      </span>
    </div>
    <div class="pokemon-sound" @click="handlePlaySound">♬</div>
  </li>
</template>

<style scoped>
.pokemon-card {
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  position: relative;
  overflow: hidden;
}

.pokemon-name {
  font-weight: bold;
  font-size: 1.25rem;
}

.pokemon-number {
  color: #fff;
}

.pokemon-sound {
  font-size: 1.25rem;
  position: absolute;
  bottom: 0.25rem;
  right: 0.5rem;
  color: #fff;
  cursor: pointer;
}

.pokemon-image {
  height: 60%;
  object-fit: contain;
  margin: 10px 0;
  transition: all 0.2s ease-in-out;
  image-rendering: pixelated;
}

.types {
  margin-top: 10px;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  margin: 2px;
  border-radius: 4px;
  color: white;
  font-size: 0.8em;
  font-weight: bold;
}

/* Cores de exemplo (você pode ter um arquivo CSS separado para isso) */
.fire {
  background-color: #fd7d24;
}
.grass {
  background-color: #9bcc50;
}
.water {
  background-color: #4592c4;
}
.electric {
  background-color: #f8d030;
}
.normal {
  background-color: #a8a878;
}
.bug {
  background-color: #a8b820;
}
.poison {
  background-color: #a040a0;
}
.flying {
  background-color: #a890f0;
}
.fairy {
  background-color: #ee99ac;
}
.fighting {
  background-color: #c03028;
}
.psychic {
  background-color: #f85888;
}
.rock {
  background-color: #b8a038;
}
.ground {
  background-color: #e0c068;
}
.ghost {
  background-color: #705898;
}
.dragon {
  background-color: #7038f8;
}
.steel {
  background-color: #b8b8d0;
}
.ice {
  background-color: #98d8d8;
}
.dark {
  background-color: #705848;
}
</style>
