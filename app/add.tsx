import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { CalendarDays, Check, ContactRound, IndianRupee, Plus, Trash2, X } from "lucide-react-native";
import { Screen } from "@/components/ui/Screen";
import { GlassCard } from "@/components/ui/GlassCard";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { colors } from "@/lib/theme";
import { addDays, formatFullDate, startOfToday, uid } from "@/lib/utils";
import { useHisaabStore } from "@/lib/store/useHisaabStore";
import { notifySuccess, notifyWarning } from "@/lib/safeHaptics";
import type { DebtDirection } from "@/types/hisaab";

type NativeDateTimePickerProps = {
  value: Date;
  mode: "date" | "time" | "datetime";
  maximumDate?: Date;
  minimumDate?: Date;
  onChange: (event: unknown, selected?: Date) => void;
};

let NativeDateTimePicker: React.ComponentType<NativeDateTimePickerProps> | null = null;
try {
  const datetimePickerModule = require("@react-native-community/datetimepicker");
  NativeDateTimePicker = datetimePickerModule.default ?? null;
} catch {
  NativeDateTimePicker = null;
}

type ContactChoice = {
  id: string;
  name: string;
  phone: string | null;
};

type EntryDraft = {
  id: string;
  amount: string;
  note: string;
};

function createEntryDraft(seed?: Partial<Pick<EntryDraft, "amount" | "note">>): EntryDraft {
  return {
    id: uid("entry"),
    amount: seed?.amount ?? "",
    note: seed?.note ?? "",
  };
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizedReminderTime(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(9, 0, 0, 0);
  return date.getTime();
}

export default function AddDebtScreen() {
  const params = useLocalSearchParams<{ debtId?: string }>();
  const debtId = getParam(params.debtId);
  const debts = useHisaabStore((state) => state.debts);
  const addDebt = useHisaabStore((state) => state.addDebt);
  const updateDebt = useHisaabStore((state) => state.updateDebt);
  const deleteDebt = useHisaabStore((state) => state.deleteDebt);
  const editingDebt = useMemo(() => debts.find((debt) => debt.id === debtId), [debtId, debts]);

  const [friendName, setFriendName] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [entries, setEntries] = useState<EntryDraft[]>(() => [createEntryDraft()]);
  const [direction, setDirection] = useState<DebtDirection>("lent");
  const [dateBorrowed, setDateBorrowed] = useState(startOfToday());
  const [dueEnabled, setDueEnabled] = useState(false);
  const [dueDate, setDueDate] = useState(addDays(startOfToday(), 7));
  const [error, setError] = useState<string | null>(null);
  const [showBorrowedPicker, setShowBorrowedPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [contacts, setContacts] = useState<ContactChoice[]>([]);
  const [contactsVisible, setContactsVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingDebt) return;
    setFriendName(editingDebt.friend_name);
    setPhone(editingDebt.friend_phone);
    setEntries([createEntryDraft({ amount: String(Math.round(editingDebt.amount)), note: editingDebt.note ?? "" })]);
    setDirection(editingDebt.direction);
    setDateBorrowed(editingDebt.date_borrowed);
    setDueEnabled(Boolean(editingDebt.due_date));
    setDueDate(editingDebt.due_date ?? addDays(startOfToday(), 7));
  }, [editingDebt?.id]);
  const title = editingDebt ? "Edit Debt" : "Log a Debt";

  function updateEntry(id: string, patch: Partial<EntryDraft>) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntryRow() {
    setEntries((current) => [...current, createEntryDraft()]);
  }

  function removeEntryRow(id: string) {
    setEntries((current) => {
      if (current.length <= 1) return current;
      return current.filter((entry) => entry.id !== id);
    });
  }

  async function pickContact() {
    let ContactsModule: typeof import("expo-contacts") | null = null;
    try {
      ContactsModule = require("expo-contacts") as typeof import("expo-contacts");
    } catch {
      ContactsModule = null;
    }

    if (!ContactsModule) {
      Alert.alert("Contacts unavailable", "Contacts access is not available in this build. Enter name manually.");
      return;
    }

    const permission = await ContactsModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Contacts blocked", "Manual name entry still works. Enable contacts later if you want autocomplete.");
      return;
    }

    const allContacts: Array<{ id?: string; name?: string; phoneNumbers?: Array<{ number?: string | null }> }> = [];
    let pageOffset = 0;
    const pageSize = 250;

    while (true) {
      const result = await ContactsModule.getContactsAsync({
        fields: [ContactsModule.Fields.PhoneNumbers],
        pageSize,
        pageOffset,
      });

      allContacts.push(...result.data);

      if (!result.hasNextPage || result.data.length === 0) {
        break;
      }

      pageOffset += result.data.length;
      if (allContacts.length > 6000) break;
    }

    const choices: ContactChoice[] = allContacts
      .filter((contact): contact is { id?: string; name: string; phoneNumbers?: Array<{ number?: string | null }> } => {
        return typeof contact.name === "string" && contact.name.trim().length > 0;
      })
      .map((contact, index) => ({
        id: contact.id ?? `${contact.name}-${index}`,
        name: contact.name.trim(),
        phone: contact.phoneNumbers?.find((item) => typeof item?.number === "string")?.number ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!choices.length) {
      Alert.alert("No contacts found", "Type the friend's name manually.");
      return;
    }

    setContacts(choices);
    setContactsVisible(true);
  }

  async function save() {
    if (!friendName.trim()) {
      setError("Friend name is required.");
      return;
    }
    const parsedEntries = entries.map((entry) => ({
      ...entry,
      amountNumber: Number(entry.amount.replace(/,/g, "")),
      noteValue: entry.note.trim(),
    }));

    if (parsedEntries.some((entry) => !entry.amount.trim() || !Number.isFinite(entry.amountNumber) || entry.amountNumber <= 0)) {
      setError("Each baaki row needs a valid amount greater than zero.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingDebt) {
        const [firstEntry] = parsedEntries;
        const payload = {
          friendName,
          phone,
          amount: firstEntry.amountNumber,
          note: firstEntry.noteValue || null,
          direction,
          dateBorrowed,
          dueDate: dueEnabled ? normalizedReminderTime(dueDate) : null,
        };
        await updateDebt(editingDebt.id, payload);
      } else {
        for (const entry of parsedEntries) {
          const payload = {
            friendName,
            phone,
            amount: entry.amountNumber,
            note: entry.noteValue || null,
            direction,
            dateBorrowed,
            dueDate: dueEnabled ? normalizedReminderTime(dueDate) : null,
          };
          await addDebt(payload);
        }
      }
      await notifySuccess();
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this hisaab.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <Screen scroll contentStyle={styles.content}>
        <View style={styles.handle} />
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close">
            <X color={colors.mist} size={21} />
          </Pressable>
          {editingDebt ? (
            <Pressable style={styles.deleteButton} onPress={() => setDeleteVisible(true)} accessibilityRole="button" accessibilityLabel="Delete debt">
              <Trash2 color={colors.danger} size={18} />
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.title}>{title}</Text>

        <GlassCard style={styles.formCard} innerStyle={styles.formInner}>
          <FieldLabel label="Friend" />
          <View style={styles.inputRow}>
            <TextInput
              value={friendName}
              onChangeText={setFriendName}
              placeholder="Rohan Sharma"
              placeholderTextColor={colors.muted}
              style={styles.input}
              selectionColor={colors.amber}
              accessibilityLabel="Friend name"
            />
            <Pressable style={styles.inlineButton} onPress={pickContact} accessibilityRole="button" accessibilityLabel="Pick from contacts">
              <ContactRound color={colors.amber} size={20} />
            </Pressable>
          </View>

          <FieldLabel label="Baaki rows" />
          {entries.map((entry, index) => (
            <View key={entry.id} style={styles.entryRow}>
              <View style={styles.entryAmountWrap}>
                <IndianRupee color={colors.amber} size={18} />
                <TextInput
                  value={entry.amount}
                  onChangeText={(next) => updateEntry(entry.id, { amount: next.replace(/[^0-9.]/g, "") })}
                  placeholder="500"
                  placeholderTextColor="rgba(245,163,32,0.42)"
                  keyboardType="numeric"
                  style={styles.entryAmountInput}
                  selectionColor={colors.amber}
                  accessibilityLabel={`Amount row ${index + 1}`}
                />
              </View>
              <TextInput
                value={entry.note}
                onChangeText={(next) => updateEntry(entry.id, { note: next })}
                placeholder="Note"
                placeholderTextColor={colors.muted}
                style={styles.entryNoteInput}
                selectionColor={colors.amber}
                accessibilityLabel={`Note row ${index + 1}`}
              />
              {!editingDebt ? (
                <Pressable
                  style={[styles.rowDeleteButton, entries.length === 1 && styles.rowDeleteButtonDisabled]}
                  onPress={() => removeEntryRow(entry.id)}
                  disabled={entries.length === 1}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove row ${index + 1}`}
                >
                  <Trash2 color={colors.danger} size={15} />
                </Pressable>
              ) : null}
            </View>
          ))}
          {!editingDebt ? (
            <Pressable style={styles.addRowButton} onPress={addEntryRow} accessibilityRole="button" accessibilityLabel="Add another baaki row">
              <Plus color={colors.amber} size={16} />
              <Text style={styles.addRowText}>Add more baaki</Text>
            </Pressable>
          ) : null}

          <FieldLabel label="Direction" />
          <SegmentedControl
            value={direction}
            onChange={setDirection}
            options={[
              { label: "They owe me", value: "lent" },
              { label: "I owe them", value: "borrowed" },
            ]}
          />

          <View style={styles.dateGrid}>
            <View style={styles.dateColumn}>
              <FieldLabel label="Date borrowed" />
              <Pressable
                style={styles.dateButton}
                onPress={() => {
                  if (!NativeDateTimePicker) {
                    Alert.alert("Date picker unavailable", "This build cannot open the date picker. Rebuild after updating dependencies.");
                    return;
                  }
                  setShowBorrowedPicker(true);
                }}
                accessibilityRole="button"
              >
                <CalendarDays color={colors.amber} size={16} />
                <Text style={styles.dateText}>{formatFullDate(dateBorrowed)}</Text>
              </Pressable>
            </View>
            <View style={styles.dateColumn}>
              <FieldLabel label="Due date" />
              <Pressable
                style={[styles.dateButton, dueEnabled && styles.dateButtonActive]}
                onPress={() => {
                  if (!dueEnabled) setDueEnabled(true);
                  if (!NativeDateTimePicker) {
                    Alert.alert("Date picker unavailable", "This build cannot open the date picker. Rebuild after updating dependencies.");
                    return;
                  }
                  setShowDuePicker(true);
                }}
                accessibilityRole="button"
              >
                <CalendarDays color={dueEnabled ? colors.amber : colors.muted} size={16} />
                <Text style={styles.dateText}>{dueEnabled ? formatFullDate(dueDate) : "Optional"}</Text>
              </Pressable>
            </View>
          </View>

          {dueEnabled ? (
            <Pressable style={styles.clearDue} onPress={() => setDueEnabled(false)} accessibilityRole="button">
              <Text style={styles.clearDueText}>Remove due-date reminder</Text>
            </Pressable>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </GlassCard>

        <Pressable
          style={[styles.cta, saving && styles.ctaDisabled]}
          onPress={save}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={editingDebt ? "Save debt changes" : "Log debt"}
        >
          <Check color={colors.ink} size={20} />
          <Text style={styles.ctaText}>{saving ? "Saving..." : editingDebt ? "Save Changes" : "Log It"}</Text>
        </Pressable>
      </Screen>

      {showBorrowedPicker && NativeDateTimePicker ? (
        <NativeDateTimePicker
          value={new Date(dateBorrowed)}
          mode="date"
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setShowBorrowedPicker(false);
            if (selected) setDateBorrowed(startOfToday(selected.getTime()));
          }}
        />
      ) : null}

      {showDuePicker && NativeDateTimePicker ? (
        <NativeDateTimePicker
          value={new Date(dueDate)}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShowDuePicker(false);
            if (selected) {
              setDueEnabled(true);
              setDueDate(normalizedReminderTime(selected.getTime()));
            }
          }}
        />
      ) : null}

      <ContactsSheet
        visible={contactsVisible}
        contacts={contacts}
        onClose={() => setContactsVisible(false)}
        onPick={(contact) => {
          setFriendName(contact.name);
          setPhone(contact.phone);
          setContactsVisible(false);
        }}
      />

      <ConfirmSheet
        visible={deleteVisible}
        title="Delete this hisaab?"
        message="This removes the transaction and any scheduled local reminders for it."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setDeleteVisible(false)}
        onConfirm={async () => {
          if (!editingDebt) return;
          await deleteDebt(editingDebt.id);
          await notifyWarning();
          setDeleteVisible(false);
          router.back();
        }}
      />
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.label}>{label}</Text>;
}

function ContactsSheet({
  visible,
  contacts,
  onClose,
  onPick,
}: {
  visible: boolean;
  contacts: ContactChoice[];
  onClose: () => void;
  onPick: (contact: ContactChoice) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassCard style={styles.contactsCard} innerStyle={styles.contactsInner}>
          <Text style={styles.contactsTitle}>Pick a contact</Text>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {contacts.map((contact) => (
              <Pressable key={contact.id} style={styles.contactRow} onPress={() => onPick(contact)} accessibilityRole="button">
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{contact.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={styles.contactMain}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone ?? "No phone number"}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: 140,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 14,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,82,82,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.26)",
  },
  title: {
    color: colors.mist,
    fontFamily: "Cinzel_600SemiBold",
    fontSize: 22,
    lineHeight: 31,
    marginBottom: 14,
  },
  formCard: {
    marginTop: 4,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: "rgba(25,18,10,0.85)",
  },
  formInner: {
    padding: 18,
  },
  label: {
    color: colors.muted,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginTop: 16,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 14,
    color: colors.mist,
    fontFamily: "Montserrat_500Medium",
    fontSize: 15,
  },
  inlineButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,163,32,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.28)",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  entryAmountWrap: {
    minHeight: 48,
    minWidth: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.32)",
    backgroundColor: "rgba(245,163,32,0.08)",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryAmountInput: {
    flex: 1,
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    lineHeight: 24,
    minWidth: 62,
  },
  entryNoteInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    color: colors.mist,
    fontFamily: "Montserrat_500Medium",
    fontSize: 13,
  },
  rowDeleteButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,82,82,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.28)",
  },
  rowDeleteButtonDisabled: {
    opacity: 0.35,
  },
  addRowButton: {
    marginTop: 10,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245,163,32,0.28)",
    backgroundColor: "rgba(245,163,32,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  addRowText: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateGrid: {
    flexDirection: "row",
    gap: 10,
  },
  dateColumn: {
    flex: 1,
  },
  dateButton: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateButtonActive: {
    borderColor: "rgba(245,163,32,0.32)",
    backgroundColor: "rgba(245,163,32,0.08)",
  },
  dateText: {
    flex: 1,
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
  },
  clearDue: {
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  clearDueText: {
    color: colors.danger,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
  },
  error: {
    color: colors.danger,
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
    marginTop: 14,
  },
  cta: {
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 18,
    shadowColor: colors.amber,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: colors.ink,
    fontFamily: "Montserrat_700Bold",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
    padding: 16,
  },
  contactsCard: {
    maxHeight: "78%",
  },
  contactsInner: {
    padding: 18,
  },
  contactsTitle: {
    color: colors.mist,
    fontFamily: "Cinzel_700Bold",
    fontSize: 30,
    marginBottom: 8,
  },
  contactRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245,163,32,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    color: colors.amber,
    fontFamily: "Montserrat_700Bold",
  },
  contactMain: {
    flex: 1,
  },
  contactName: {
    color: colors.mist,
    fontFamily: "Montserrat_700Bold",
    fontSize: 14,
  },
  contactPhone: {
    color: colors.muted,
    fontFamily: "Montserrat_400Regular",
    fontSize: 12,
  },
});

