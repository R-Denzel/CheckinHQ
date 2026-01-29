<template>
  <v-container class="pb-16">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-btn icon variant="text" @click="$router.back()">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <h1 class="text-h6 font-weight-bold ml-2">Booking Details</h1>
          </div>
          
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="$router.push(`/bookings/${booking.id}/edit`)">
                <template v-slot:prepend>
                  <v-icon>mdi-pencil</v-icon>
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item @click="handleDelete">
                <template v-slot:prepend>
                  <v-icon color="error">mdi-delete</v-icon>
                </template>
                <v-list-item-title class="text-error">Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-row v-if="loading">
      <v-col>
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <!-- Booking Content -->
    <div v-else-if="booking">
      <!-- Guest Info Card -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title>
              <v-avatar :color="statusColor" size="40" class="mr-3">
                <v-icon color="white">{{ statusIcon }}</v-icon>
              </v-avatar>
              {{ booking.guest_name }}
            </v-card-title>
            <v-card-text>
              <v-chip :color="statusColor" class="mb-4">{{ booking.status }}</v-chip>
              
              <v-list density="compact">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-phone</v-icon>
                  </template>
                  <v-list-item-title>{{ booking.phone_number }}</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-map-marker</v-icon>
                  </template>
                  <v-list-item-title>{{ booking.property_destination }}</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon>mdi-calendar-range</v-icon>
                  </template>
                  <v-list-item-title>
                    {{ formatDate(booking.check_in_date) }} → {{ formatDate(booking.check_out_date) }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>

              <!-- WhatsApp Button -->
              <v-btn
                color="success"
                block
                size="large"
                class="mt-4"
                :href="whatsappLink"
                target="_blank"
                @click="handleWhatsAppClick"
              >
                <v-icon left>mdi-whatsapp</v-icon>
                Open WhatsApp
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Payment Card -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title>Payment</v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span>Total Amount:</span>
                <span class="font-weight-bold">${{ booking.total_amount || 0 }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Deposit Paid:</span>
                <span class="font-weight-bold">${{ booking.deposit_amount || 0 }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between">
                <span>Balance Due:</span>
                <span class="font-weight-bold text-accent">
                  ${{ (booking.total_amount || 0) - (booking.deposit_amount || 0) }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Notes Timeline -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4">
            <v-card-title>Notes</v-card-title>
            <v-card-text>
              <!-- Add Note Form -->
              <v-textarea
                v-model="newNote"
                label="Add a note"
                rows="2"
                variant="outlined"
                class="mb-2"
              />
              <v-btn
                color="primary"
                @click="handleAddNote"
                :loading="addingNote"
                :disabled="!newNote.trim()"
              >
                Add Note
              </v-btn>

              <v-divider class="my-4" />

              <!-- Notes List -->
              <v-timeline v-if="notes && notes.length > 0" density="compact" side="end">
                <v-timeline-item
                  v-for="note in notes"
                  :key="note.id"
                  dot-color="primary"
                  size="small"
                >
                  <div class="mb-2">
                    <div class="text-caption text-grey">
                      {{ formatDateTime(note.created_at) }}
                    </div>
                    <div>{{ note.note_text }}</div>
                  </div>
                </v-timeline-item>
              </v-timeline>
              <p v-else class="text-grey text-center">No notes yet</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Confirm Delete Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Booking?</v-card-title>
        <v-card-text>
          This will permanently delete the booking for {{ booking?.guest_name }}.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()

const booking = ref(null)
const notes = ref([])
const newNote = ref('')
const loading = ref(false)
const addingNote = ref(false)
const showDeleteDialog = ref(false)
const deleting = ref(false)

// Status color and icon
const statusColor = computed(() => {
  const colors = {
    'Inquiry': 'grey',
    'Quoted': 'info',
    'Deposit Paid': 'accent',
    'Confirmed': 'success',
    'Checked In': 'primary',
    'Checked Out': 'grey-darken-1'
  }
  return colors[booking.value?.status] || 'grey'
})

const statusIcon = computed(() => {
  const icons = {
    'Inquiry': 'mdi-help-circle',
    'Quoted': 'mdi-file-document',
    'Deposit Paid': 'mdi-cash',
    'Confirmed': 'mdi-check-circle',
    'Checked In': 'mdi-login',
    'Checked Out': 'mdi-logout'
  }
  return icons[booking.value?.status] || 'mdi-bookmark'
})

const whatsappLink = computed(() => {
  if (!booking.value) return ''
  const phone = booking.value.phone_number.replace(/\D/g, '')
  return `https://wa.me/${phone}`
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { 
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleWhatsAppClick = async () => {
  await bookingStore.markContacted(booking.value.id)
}

const handleAddNote = async () => {
  if (!newNote.value.trim()) return
  
  addingNote.value = true
  try {
    await bookingStore.addNote(booking.value.id, newNote.value)
    // Refresh booking data to get updated notes
    await loadBooking()
    newNote.value = ''
  } catch (error) {
    console.error('Failed to add note:', error)
  } finally {
    addingNote.value = false
  }
}

const handleDelete = () => {
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  deleting.value = true
  try {
    await bookingStore.deleteBooking(booking.value.id)
    router.push('/bookings')
  } catch (error) {
    console.error('Failed to delete booking:', error)
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
  }
}

const loadBooking = async () => {
  loading.value = true
  try {
    const data = await bookingStore.fetchBooking(route.params.id)
    booking.value = data.booking
    notes.value = data.notes
  } catch (error) {
    console.error('Failed to load booking:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadBooking)
</script>
