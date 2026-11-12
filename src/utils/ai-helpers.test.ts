import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArtifacts,
  formatTimestamp,
  estimateReadingTime,
  sanitizePrompt,
  extractCitations,
  filterChatSessions,
  cleanTextForSpeech,
  assembleTranscript,
  pruneConversationContext,
} from './ai-helpers';

test('parseArtifacts extracts markdown and code blocks accurately', () => {
  const markdown = `
Here is an HTML button component:
\`\`\`html
<button class="btn">Click me</button>
\`\`\`

And a Python script:
\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\`
`;

  const artifacts = parseArtifacts(markdown);
  assert.equal(artifacts.length, 2);
  assert.equal(artifacts[0].type, 'html');
  assert.equal(artifacts[0].language, 'html');
  assert.equal(artifacts[0].content, '<button class="btn">Click me</button>');
  assert.equal(artifacts[1].type, 'code');
  assert.equal(artifacts[1].language, 'python');
});

test('estimateReadingTime calculates word count and minutes', () => {
  const shortText = 'The quick brown fox jumps over the lazy dog.';
  const res = estimateReadingTime(shortText);
  assert.equal(res.words, 9);
  assert.equal(res.minutes, 1);

  const emptyRes = estimateReadingTime('');
  assert.equal(emptyRes.words, 0);
  assert.equal(emptyRes.minutes, 0);
});

test('sanitizePrompt trims and sanitizes input', () => {
  assert.equal(sanitizePrompt('   Explain relativity   '), 'Explain relativity');
  assert.equal(sanitizePrompt(''), '');
});

test('extractCitations parses grounding chunks deduplicating domains', () => {
  const metadata = {
    groundingChunks: [
      { web: { uri: 'https://en.wikipedia.org/wiki/Artificial_intelligence', title: 'Artificial Intelligence - Wikipedia' } },
      { web: { uri: 'https://en.wikipedia.org/wiki/Artificial_intelligence', title: 'Duplicate' } },
      { web: { uri: 'https://www.nature.com/articles/s41586-021-03819-2', title: 'Nature Article' } },
    ],
  };

  const citations = extractCitations(metadata);
  assert.equal(citations.length, 2);
  assert.equal(citations[0].domain, 'en.wikipedia.org');
  assert.equal(citations[0].title, 'Artificial Intelligence - Wikipedia');
  assert.equal(citations[1].domain, 'nature.com');
});

test('filterChatSessions filters by title and message contents', () => {
  const sessions = [
    { title: 'React Performance Tuning', messages: [{ content: 'useMemo usage' }] },
    { title: 'Quantum Physics Guide', messages: [{ content: 'Schrodinger equation' }] },
    { title: 'French Translation', messages: [{ content: 'Bonjour le monde' }] },
  ];

  const searchTitle = filterChatSessions(sessions, 'quantum');
  assert.equal(searchTitle.length, 1);
  assert.equal(searchTitle[0].title, 'Quantum Physics Guide');

  const searchContent = filterChatSessions(sessions, 'useMemo');
  assert.equal(searchContent.length, 1);
  assert.equal(searchContent[0].title, 'React Performance Tuning');
});

test('cleanTextForSpeech strips reasoning, code blocks, and markdown for audio speech synthesis', () => {
  const rawText = `
<thinking>
We need to calculate 2 + 2.
</thinking>
# Quick Math
Here is **the answer**:
\`\`\`python
print(2 + 2)
\`\`\`
Visit [Google](https://google.com) for more details.
`;

  const cleaned = cleanTextForSpeech(rawText);
  assert.ok(!cleaned.includes('thinking'));
  assert.ok(!cleaned.includes('print(2 + 2)'));
  assert.ok(cleaned.includes('Code snippet omitted.'));
  assert.ok(cleaned.includes('Quick Math'));
  assert.ok(cleaned.includes('the answer:'));
  assert.ok(cleaned.includes('Google for more details.'));
  assert.ok(!cleaned.includes('**'));
  assert.ok(!cleaned.includes('#'));
});

test('assembleTranscript combines base text, final speech, and interim speech seamlessly', () => {
  assert.equal(
    assembleTranscript('Please explain', 'quantum mechanics', 'in simple terms'),
    'Please explain quantum mechanics in simple terms'
  );

  assert.equal(
    assembleTranscript('', 'How does GPS work', ''),
    'How does GPS work'
  );

  assert.equal(
    assembleTranscript('Draft an email', '', 'to my manager'),
    'Draft an email to my manager'
  );
});

test('pruneConversationContext trims context and purges historical attachments', () => {
  const history = [
    { role: 'user' as const, content: 'First message', attachments: [{ mimeType: 'image/png', data: 'huge-data-1' }] },
    { role: 'model' as const, content: 'First reply' },
    { role: 'user' as const, content: 'Second message' },
    { role: 'model' as const, content: 'Second reply' },
    { role: 'user' as const, content: 'Third message', attachments: [{ mimeType: 'image/png', data: 'latest-data' }] },
  ];

  // Trims to maxTurns: 3
  const pruned = pruneConversationContext(history, 3);
  assert.equal(pruned.length, 3);
  assert.equal(pruned[0].content, 'Second message');
  // Latest message retains its heavy attachment
  assert.equal(pruned[2].attachments?.[0]?.data, 'latest-data');

  // When older messages have attachments, heavy data is stripped but referenced
  const prunedAll = pruneConversationContext(history, 5);
  assert.equal(prunedAll.length, 5);
  assert.equal(prunedAll[0].attachments, undefined);
  assert.ok(prunedAll[0].content.includes('Prior attachment'));
  assert.equal(prunedAll[4].attachments?.[0]?.data, 'latest-data');
});



