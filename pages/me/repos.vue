<script setup lang="ts">
import type { Repository } from "~/types/Response/GitHub"

import { useI18n } from 'vue-i18n'

const { $prepareMeta } = useNuxtApp()
const { t } = useI18n()

const { data: repos, status } = await useLazyAsyncData(
  "repos",
  async () => {
    const filter = ["zhw1nq", "DBM", "zhw1nq.github.io"]

    const repos = await $fetch<Repository[]>(
      "https://api.github.com/users/zhw1nq/repos?per_page=100",
    )

    return repos
      ?.filter((repo) => repo.fork === false && !filter.includes(repo.name))
      ?.sort((a, b) => b?.stargazers_count - a?.stargazers_count)
  },
  {
    server: false,
  },
)

useHead(() => ({
  title: t("pages.repos.metaTitle"),
  meta: $prepareMeta({
    title: t("pages.repos.metaTitle"),
    description: t("pages.repos.metaDescription"),
  }),
}))
</script>

<template>
  <PageLayout :title="t('pages.repos.title')" :description="t('pages.repos.description')">
    <div v-if="status === 'pending'" class="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
      <SkeletonLoader v-for="i in 9" :key="`skeleton-${i}`" type="repository" />
    </div>

    <div v-else class="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
      <SmartLink
        v-for="(repo, index) in repos"
        :key="`repo-${index}`"
        :href="repo.html_url"
        blank
      >
        <CardRepository
          :name="repo.name"
          :language="repo.language"
          :stars="repo.stargazers_count"
          :description="repo.description"
          :license="repo.license && repo.license.spdx_id"
          :top="index === 0"
          class="h-full"
        />
      </SmartLink>
    </div>
  </PageLayout>
</template>
