import {MUET_REVIEWED_TOPICS} from '../src/data/muetReviewedTopics';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MUET_EXTRA_TOPICS} from '../src/data/muetExtraTopics';
import {validateMUETTopic,topicFingerprint,unseenTopics} from '../src/server/muetBankPolicy';

test('24 original sets meet prompt structure and have 96 distinct candidate tasks',()=>{
 assert.equal(MUET_EXTRA_TOPICS.length,24);
 for(const topic of MUET_EXTRA_TOPICS)assert.equal(validateMUETTopic(topic),true,topic.title);
 assert.equal(new Set(MUET_EXTRA_TOPICS.map(topicFingerprint)).size,24);
 assert.equal(new Set(MUET_EXTRA_TOPICS.flatMap(t=>Object.values(t.part1.tasks))).size,96);
 assert.equal(new Set([...MUET_REVIEWED_TOPICS,...MUET_EXTRA_TOPICS].flatMap(t=>Object.values(t.part1.tasks))).size,180);
});
test('21 existing sets retain IDs and meet the revised prompt structure',()=>{assert.equal(MUET_REVIEWED_TOPICS.length,21);for(const topic of MUET_REVIEWED_TOPICS)assert.equal(validateMUETTopic(topic),true,topic.title);});

test('Part 1 completion never repeats; Part 2 remains available until finished; mock cannot reuse either',()=>{
 const [a,b]=MUET_EXTRA_TOPICS,done=new Set([`${a.id}:Part1`]);
 assert.deepEqual(unseenTopics([a,b],done,'Part1'),[b]);
 assert.deepEqual(unseenTopics([a,b],done,'Part2'),[a,b]);
 assert.deepEqual(unseenTopics([a,b],done,'Mock'),[b]);
 done.add(`${a.id}:Part2`);done.add(`${b.id}:Part1`);
 assert.equal(unseenTopics([a,b],done,'Part1').length,0,'exhaustion never resets completed history');
});
test('malformed generation is rejected before saving to the bank',()=>{
 const topic=structuredClone(MUET_EXTRA_TOPICS[0]);
 topic.part1.tasks.A='Talk about a very long prompt that should not be accepted for this speaking task.';
 assert.equal(validateMUETTopic(topic),false);
 const second=structuredClone(MUET_EXTRA_TOPICS[0]);second.part2.points[0]='An excessively wordy mind map idea';assert.equal(validateMUETTopic(second),false);
 const third=structuredClone(MUET_EXTRA_TOPICS[0]);third.part2.points.pop();assert.equal(validateMUETTopic(third),false);
});
