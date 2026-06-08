<template>
  <div class="admin-table">
    <div class="table-wrapper admin-table-desktop">
      <table>
        <thead>
          <tr>
            <th v-if="selectable" class="select-col">
              <input
                ref="selectAllRef"
                type="checkbox"
                :checked="allSelected"
                :aria-label="t('adminPages.users.selectAll')"
                @change="toggleAll"
              />
            </th>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
            <th v-if="showActions">{{ t('common.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td v-if="selectable" class="select-col">
              <input
                type="checkbox"
                :checked="selectedIds.includes(item.id)"
                :aria-label="t('adminPages.users.selectUser', { name: `${item.firstName} ${item.lastName}` })"
                @change="toggleItem(item.id)"
              />
            </td>
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :item="item">
                {{ formatCell(item, col) }}
              </slot>
            </td>
            <td v-if="showActions">
              <div class="btn-group">
                <button class="btn btn-secondary btn-sm" @click="$emit('edit', item)">{{ t('common.edit') }}</button>
                <button class="btn btn-danger btn-sm" @click="$emit('delete', item)">{{ t('common.delete') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td :colspan="columns.length + (showActions ? 1 : 0) + (selectable ? 1 : 0)" class="text-center text-muted">
              {{ t('adminPages.table.noEntries') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="admin-table-mobile">
      <article v-for="item in items" :key="`mobile-${item.id}`" class="admin-table-card">
        <dl class="admin-table-card-fields">
          <template v-for="col in columns" :key="`mobile-${item.id}-${col.key}`">
            <dt>{{ col.label }}</dt>
            <dd>
              <slot :name="`cell-${col.key}`" :item="item">
                {{ formatCell(item, col) }}
              </slot>
            </dd>
          </template>
        </dl>
        <div v-if="showActions" class="btn-group admin-table-card-actions">
          <button class="btn btn-secondary btn-sm" @click="$emit('edit', item)">{{ t('common.edit') }}</button>
          <button class="btn btn-danger btn-sm" @click="$emit('delete', item)">{{ t('common.delete') }}</button>
        </div>
      </article>
      <p v-if="items.length === 0" class="text-center text-muted">{{ t('adminPages.table.noEntries') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  items: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  showActions: { type: Boolean, default: true },
  selectable: { type: Boolean, default: false },
  selectedIds: { type: Array, default: () => [] },
});

const emit = defineEmits(['edit', 'delete', 'update:selectedIds']);

const { t } = useI18n();

const allSelected = computed(() => (
  props.items.length > 0 && props.items.every((item) => props.selectedIds.includes(item.id))
));

const someSelected = computed(() => (
  props.selectedIds.length > 0 && !allSelected.value
));

const selectAllRef = ref(null);

watch([someSelected, allSelected], () => {
  if (selectAllRef.value) {
    selectAllRef.value.indeterminate = someSelected.value;
  }
}, { flush: 'post' });

function toggleAll(event) {
  if (event.target.checked) {
    emit('update:selectedIds', props.items.map((item) => item.id));
  } else {
    emit('update:selectedIds', []);
  }
}

function toggleItem(id) {
  const next = props.selectedIds.includes(id)
    ? props.selectedIds.filter((value) => value !== id)
    : [...props.selectedIds, id];
  emit('update:selectedIds', next);
}

function formatCell(item, col) {
  const val = item[col.key];
  if (col.format === 'role') {
    return val === 'admin' ? t('common.admin') : t('common.user');
  }
  if (val === null || val === undefined) return '–';
  return val;
}
</script>

<style scoped>
.select-col {
  width: 2.5rem;
  text-align: center;
}

.admin-table-mobile {
  display: none;
}

.admin-table-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.875rem;
  background: var(--color-surface);
}

.admin-table-card-fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.75rem;
  margin: 0;
}

.admin-table-card-fields dt {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.admin-table-card-fields dd {
  margin: 0;
  font-size: 0.875rem;
}

.admin-table-card-actions {
  margin-top: 0.75rem;
}

@media (max-width: 768px) {
  .admin-table-desktop {
    display: none;
  }

  .admin-table-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
