import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_HOME_CONTENT, normalizeHomeContent, publishedHomeContent } from '../src/homeContent.js';

test('default home cards preserve their titles, categories, and prompts', () => {
  const content = publishedHomeContent(DEFAULT_HOME_CONTENT);
  assert.deepEqual(content.sections.map((section) => section.title), ['Home']);
  assert.equal(content.sections[0].topics.length, 10);
  assert.equal(content.sections[0].topics[0].title, 'Talk about anything');
  assert.equal(content.sections[0].topics[0].category, 'General');
  assert.equal(content.sections[0].topics[6].category, 'Interview');
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

test('published home cards omit hidden sections and cards', () => {
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
  assert.equal(published.sections[0].topics[0].category, 'Visible');
});
