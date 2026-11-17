/**
 * The voice (ADR 0025 §12, Q-234): plain in the app, smalty where it is safe. The few playful lines the app says are
 * here, in one place, each with the plain words that say the same thing and where it may be said: on a success seen
 * once, and on an empty screen. Never on a paused day, a refused file, a decision, a hash or the audit, and never a
 * phrase that says "don't quite believe this" of audited data (`NEVER`).
 *
 * Someone who wants none of it turns on *Plain words* (About this flow, or `?plain` in the address): each line is then
 * its plain words, or nothing where the screen already says them. The play is decoration over a serious surface, and
 * the switch shows it.
 *
 * Pure. Nothing the data is made from reads this module.
 */

/** Where a playful line may be said. */
export type VoiceLine = 'sealed' | 'firstPass' | 'emptyCatalogue';

export interface VoiceSaid {
  /** The line, in the family's voice. */
  play: string;
  /** The same in plain words. Empty where the screen says it already beside the line. */
  plain: string;
  /** The one place it is said. */
  where: string;
}

export const VOICE: Record<VoiceLine, VoiceSaid> = {
  sealed: { play: 'Worth its smalt.', plain: '', where: 'under a gold dataset’s seal, on a run whose every gate passed with nothing held' },
  firstPass: { play: 'Worth its smalt.', plain: '', where: 'the status line, once, after it says that a flow added from the catalogue went out as usual on its first day here' },
  emptyCatalogue: { play: 'Nothing upstream yet.', plain: 'This build ships no flow to add.', where: 'the catalogue, where the build ships no flow' },
};

/** What the family's wordplay never says of audited data: "a grain of smalt" asks the reader not to quite believe it,
 * and "smalted" or "smalt away" say it was tampered with or lost. */
export const NEVER: readonly RegExp[] = [/grain of smalt/i, /pinch of smalt/i, /smalt away/i, /smalted/i, /take it with/i];

/** A line as it is said: in the family's voice, or in plain words where plain words are asked for. */
export const voice = (line: VoiceLine, plain: boolean): string => (plain ? VOICE[line].plain : VOICE[line].play);

/** Whether a text keeps to the rule: none of the phrases the voice never uses. */
export const keepsToVoice = (text: string): boolean => !NEVER.some((re) => re.test(text));
