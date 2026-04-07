INSERT INTO challenges (text, difficulty) VALUES
  ('The quick brown fox jumps over the lazy dog.', 'easy'),
  ('Pack my box with five dozen liquor jugs.', 'easy'),
  ('How vexingly quick daft zebras jump!', 'easy'),
  ('The five boxing wizards jump quickly.', 'medium'),
  ('Amazingly few discotheques provide jukeboxes.', 'medium'),
  ('Sphinx of black quartz, judge my vow.', 'medium'),
  ('Two driven jocks help fax my big quiz.', 'medium'),
  ('The jay, pig, fox, zebra and my wolves quack!', 'hard'),
  ('Crazy Frederick bought many very exquisite opal jewels.', 'hard'),
  ('We promptly judged antique ivory buckles for the next prize.', 'hard'),
  ('A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent.', 'hard'),
  ('Jived fox nymph grabs quick waltz.', 'easy')
ON CONFLICT DO NOTHING;
