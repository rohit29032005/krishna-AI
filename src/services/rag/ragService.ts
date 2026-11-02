import { ChatHistoryMessage, GitaVerse } from '../../types';
import { verifiedVerses } from '../gita/gitaKnowledgeBase';

const tokens = (s: string) => s.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || [];
const needsDirectSupport = (s: string) => /\b(suicid(?:e|al)|abuse|abused|unsafe|died|death|grieving)\b|kill myself|hurt myself|hurt (?:him|her|them)|end my life|marna chahta|jeena nahi|jeena nahin|आत्महत्या|मृत्यु|निधन|शोक|मारना चाहता/i.test(s);

// Theme candidates for the small existing library; not semantic search or certification.
function candidates(text: string): string[] {
  if (needsDirectSupport(text)) return [];
  const q = text.normalize('NFKC').toLowerCase();
  const words = new Set(tokens(q));
  const has = (...terms: string[]) => terms.some(term => words.has(term));
  const scores = new Map<string, number>();
  const add = (id: string, value: number) => scores.set(id, (scores.get(id) || 0) + value);
  // Match the combination of a personal decision and fear/inaction, not 'job' alone.
  const decision = /\b(decid\w*|decision\w*|cho(?:ice|ices|ose|osing)|options?|offers?|paths?)\b|निर्णय|फैसल|विकल्प|चुन|faisl[ae]|nirnay/.test(q);
  const uncertainty = /second[\s-]+guess|\b(paraly[sz]ed|terrified|afraid|fear|regret|wrong|mistake|indecisi\w*)\b|(?:cannot|can't|unable to)\s+(?:decide|choose)|डर|गलत|संशय|दुविधा|\b(darr?|galat|ghalat)\b/.test(q);
  const personalDecision = /\b(i|me|my|myself)\b|मैं|मुझे|मेरे|\b(main|mujhe|mere)\b/.test(q) || /गलत.*फैसल|galat.*faisl/.test(q);
  const decisionParalysis = decision && uncertainty && personalDecision;
  if (decisionParalysis) add('BG_2_47',4);
  if (has('exam','exams','interview','career','careers','promotion','responsibilities','responsibility','duties','परीक्षा','जिम्मेदारी','जिम्मेदारियों','कर्तव्य','नौकरी')) add('BG_2_47',2);
  if (/expectations.*(?:everyone|others)|carrying.*responsibil|pressure.*(?:family|work)|zimmedari|zimmedariyon/.test(q)) add('BG_2_47',2);
  if (/lost (?:an? |my |the )?opportunity|missed.*opportunit|phase of (?:my |your )?life|stuck in the past|moving forward.*unknown|move on|life.*transition|avsar|badlav|अवसर|बदलाव|अतीत|आगे बढ़/.test(q)) add('BG_2_14',3);
  const angerNegated = /(?:not|never|no longer)\s+(?:feeling\s+)?(?:angry|anger)|gussa\s+(?:nahi|nahin)|गुस्सा\s+नहीं/.test(q);
  if (!angerNegated && has('anger','angry','rage','revenge','betrayed','betrayal','gussa','krodh','badla','गुस्सा','क्रोध','बदला','धोखा')) add('BG_2_62',2);
  const personal = /\b(i|me|my|myself|feel|feeling)\b|खुद|मैं|मुझे|अपने|apne|mujhe|khud/.test(q);
  if (personal && /\b(inferior|inferiority|comparing|comparison|mimicking|copying)\b|falling behind|behind (?:everyone|others|my friends)|तुलना|हीन|नकल|peeche|piche/.test(q)) add('BG_6_5',4);
  if (has('discipline','concentration','अनुशासन','एकाग्रता')) add('BG_6_5',2);
  if (has('lonely','loneliness','akela','akeli','akelapan','अकेलापन','अकेला','अकेली')) add('BG_6_5',2);
  // Career vocabulary alone is not a second concern when the issue is comparison.
  if (scores.has('BG_6_5') && !decisionParalysis && !/exam|interview|responsibil|duties|workload|परीक्षा|जिम्मेदार|कर्तव्य/.test(q)) scores.delete('BG_2_47');
  const ranked = [...scores.entries()].sort((a,b) => b[1]-a[1]);
  return ranked.slice(0, 2).map(([id]) => id);
}

class RagServiceImpl {
  async retrieveRelevantVerses(userQuery: string, history: ChatHistoryMessage[] = []): Promise<GitaVerse[]> {
    if (needsDirectSupport(userQuery)) return [];
    let ids = candidates(userQuery);
    // Only short conversational continuations inherit the preceding user's topic.
    const followUp = tokens(userQuery).length <= 12 && /^(yes|no|okay|ok|h\s+yes|reading|a book|book|walking|music|i (?:tried|already|could|can)|that|it|haan|han|ji|हाँ|जी|किताब|पढ़ना)\b/i.test(userQuery.trim());
    if (!ids.length && followUp) {
      for (const item of [...history].reverse()) {
        if (item.role !== 'user') continue;
        if (needsDirectSupport(item.text)) break;
        ids = candidates(item.text);
        if (ids.length) break;
      }
    }
    return ids.flatMap(id => verifiedVerses.find(v => v.id === id) || []);
  }
  async retrieveRelevantVerse(userQuery: string, history: ChatHistoryMessage[] = []): Promise<GitaVerse | null> {
    return (await this.retrieveRelevantVerses(userQuery, history))[0] || null;
  }
}
export const RagService = new RagServiceImpl();
