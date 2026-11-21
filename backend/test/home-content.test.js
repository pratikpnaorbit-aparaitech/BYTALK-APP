import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_HOME_CONTENT, normalizeHomeContent, publishedHomeContent } from '../src/homeContent.js';

test('default home content preserves the existing practice sections and prompts', () => {
  const content = publishedHomeContent(DEFAULT_HOME_CONTENT);
  assert.deepEqual(content.sections.map((section) => section.title), ['General', 'Interview']);
  assert.equal(content.sections[0].topics[0].title, 'Talk about anything');
  assert.equal(content.sections[0].topics[0].starterPrompt, "Let's have an open and friendly conversation about anything on your mind!");
});

test('home content rejects duplicate IDs and topics without titles or prompts', () => {
  const duplicateSections = {
    sections: [
      { id: 'custom', title: 'First', topics: [] },
      { id: 'custom', title: 'Second', topics: [] },
    ],
  };
  assert.equal(normalizeHomeContent(duplicateSections), null);

  const missingPrompt = {
    sections: [{ id: 'custom', title: 'Custom', topics: [{ id: 'topic', title: 'Talk', starterPrompt: '' }] }],
  };
  assert.equal(normalizeHomeContent(missingPrompt), null);
});

test('published home content omits hidden sections and cards', () => {
  const content = {
    sections: [
      {
        id: 'visible',
        title: 'Visible',
        enabled: true,
        topics: [
          { id: 'shown', title: 'Shown', starterPrompt: 'Say hello.' },
          { id: 'hidden', title: 'Hidden', starterPrompt: 'Do not show.', enabled: false },
        ],
      },
      { id: 'disabled', title: 'Disabled', enabled: false, topics: [] },
    ],
  };
  const published = publishedHomeContent(content);
  assert.equal(published.sections.length, 1);
  assert.deepEqual(published.sections[0].topics.map((topic) => topic.id), ['shown']);
});
