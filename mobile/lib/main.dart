import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';

import 'theme.dart';

const genesisPrev =
    '0000000000000000000000000000000000000000000000000000000000000000';
const limitation =
    'THIS IS a hash-chained log of event/result/blame/owner/outcome. '
    'THIS IS NOT a court, UL, TemporalLock, a truth score, or a charge sheet. '
    'Blank owner → UNOWNED. Demo rows are format proof.';

void main() {
  runApp(const EmployeeLockApp());
}

class EmployeeLockApp extends StatelessWidget {
  const EmployeeLockApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EmployeeLock',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const LogPage(),
    );
  }
}

class LogRow {
  LogRow({
    required this.entryId,
    required this.timestamp,
    required this.event,
    required this.result,
    required this.blamePlaced,
    required this.ownerNamed,
    required this.renamedFrom,
    required this.outcomeShort,
    required this.outcomeLong,
    required this.evidenceIds,
    required this.confidence,
    required this.observer,
    required this.fileSha256s,
    required this.prevHash,
    required this.hash,
  });

  final String entryId;
  final String timestamp;
  final String event;
  final String result;
  final String blamePlaced;
  final String ownerNamed;
  final String renamedFrom;
  final String outcomeShort;
  final String outcomeLong;
  final String evidenceIds;
  final double confidence;
  final String observer;
  final String fileSha256s;
  final String prevHash;
  final String hash;

  bool get hashOk => recompute() == hash;
  String get unowned => ownerNamed.trim().isEmpty ? 'UNOWNED' : 'owned';
  String get nameMoved => renamedFrom.trim().isEmpty ? 'stable' : 'RENAMED';

  String recompute() => digest({
        'entry_id': entryId,
        'timestamp': timestamp,
        'event': event,
        'result': result,
        'blame_placed': blamePlaced,
        'owner_named': ownerNamed,
        'renamed_from': renamedFrom,
        'outcome_short': outcomeShort,
        'outcome_long': outcomeLong,
        'evidence_ids': evidenceIds,
        'confidence': confidence,
        'observer': observer,
        'file_sha256s': fileSha256s,
        'prev_hash': prevHash,
      });
}

String digest(Map<String, Object> fields) {
  final payload = <String, String>{};
  for (final e in fields.entries) {
    if (e.key == 'confidence') {
      payload[e.key] = '__EL_CONFIDENCE__';
    } else {
      payload[e.key] = e.value.toString();
    }
  }
  final keys = payload.keys.toList()..sort();
  var raw =
      '{${keys.map((k) => '${jsonEncode(k)}:${jsonEncode(payload[k])}').join(',')}}';
  final conf = (fields['confidence'] as double).toStringAsFixed(6);
  raw = raw.replaceAll('"__EL_CONFIDENCE__"', conf);
  return sha256.convert(utf8.encode(raw)).toString();
}

class LogPage extends StatefulWidget {
  const LogPage({super.key});

  @override
  State<LogPage> createState() => _LogPageState();
}

class _LogPageState extends State<LogPage> {
  final _event = TextEditingController();
  final _result = TextEditingController();
  final _blame = TextEditingController();
  final _owner = TextEditingController();
  final _renamed = TextEditingController();
  final _short = TextEditingController();
  final _long = TextEditingController();
  final _chain = <LogRow>[];
  String _verify = 'no chain yet';

  @override
  void dispose() {
    _event.dispose();
    _result.dispose();
    _blame.dispose();
    _owner.dispose();
    _renamed.dispose();
    _short.dispose();
    _long.dispose();
    super.dispose();
  }

  String _now() =>
      DateTime.now().toUtc().toIso8601String().split('.').first + 'Z';

  void _append() {
    final prev = _chain.isEmpty ? genesisPrev : _chain.last.hash;
    final n = _chain.length + 1;
    final entryId = 'EL-${n.toString().padLeft(4, '0')}';
    final ts = _now();
    final fields = <String, Object>{
      'entry_id': entryId,
      'timestamp': ts,
      'event': _event.text,
      'result': _result.text,
      'blame_placed': _blame.text,
      'owner_named': _owner.text,
      'renamed_from': _renamed.text,
      'outcome_short': _short.text,
      'outcome_long': _long.text,
      'evidence_ids': '',
      'confidence': 0.7,
      'observer': 'operator',
      'file_sha256s': '',
      'prev_hash': prev,
    };
    final hash = digest(fields);
    setState(() {
      _chain.add(LogRow(
        entryId: entryId,
        timestamp: ts,
        event: _event.text,
        result: _result.text,
        blamePlaced: _blame.text,
        ownerNamed: _owner.text,
        renamedFrom: _renamed.text,
        outcomeShort: _short.text,
        outcomeLong: _long.text,
        evidenceIds: '',
        confidence: 0.7,
        observer: 'operator',
        fileSha256s: '',
        prevHash: prev,
        hash: hash,
      ));
      _verifyChain();
    });
  }

  void _sample() {
    _event.text = 'process outcome recorded with no named owner';
    _result.text = 'row logged as format proof';
    _blame.text = '';
    _owner.text = '';
    _renamed.text = '';
    _short.text = 'unnamed prior process visible as UNOWNED';
    _long.text = 'demo genesis row; replace with real work. not an accusation.';
    _append();
    _event.text = 'records desk took the ticket from the prior queue name';
    _result.text = 'owner named; prior name moved';
    _owner.text = 'records desk';
    _renamed.text = 'ticket queue';
    _short.text = 'RENAMED flag set; owned as a record';
    _long.text = 'demo owned row; replace with real work. not an accusation.';
    _append();
  }

  void _verifyChain() {
    if (_chain.isEmpty) {
      _verify = 'no chain yet';
      return;
    }
    var ok = true;
    for (var i = 0; i < _chain.length; i++) {
      final rec = _chain[i];
      if (!rec.hashOk) ok = false;
      final expectedPrev = i == 0 ? genesisPrev : _chain[i - 1].hash;
      if (rec.prevHash != expectedPrev) ok = false;
    }
    final unowned = _chain.where((r) => r.unowned == 'UNOWNED').length;
    final renamed = _chain.where((r) => r.nameMoved == 'RENAMED').length;
    _verify =
        '${ok ? 'chain OK' : 'BREAK'} · ${_chain.length} rows · UNOWNED $unowned · RENAMED $renamed';
  }

  void _new() {
    setState(() {
      _chain.clear();
      _verify = 'no chain yet';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('EmployeeLock')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(limitation, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          Text(_verify, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          TextField(controller: _event, decoration: const InputDecoration(labelText: 'event')),
          TextField(controller: _result, decoration: const InputDecoration(labelText: 'result')),
          TextField(controller: _blame, decoration: const InputDecoration(labelText: 'blame_placed (blank ok)')),
          TextField(controller: _owner, decoration: const InputDecoration(labelText: 'owner_named (blank → UNOWNED)')),
          TextField(controller: _renamed, decoration: const InputDecoration(labelText: 'renamed_from')),
          TextField(controller: _short, decoration: const InputDecoration(labelText: 'outcome_short')),
          TextField(controller: _long, decoration: const InputDecoration(labelText: 'outcome_long')),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilledButton(onPressed: _append, child: const Text('Add row')),
              OutlinedButton(onPressed: _sample, child: const Text('Sample')),
              OutlinedButton(onPressed: () => setState(_verifyChain), child: const Text('Verify')),
              OutlinedButton(onPressed: _new, child: const Text('New')),
            ],
          ),
          const SizedBox(height: 16),
          for (final rec in _chain)
            Card(
              child: ListTile(
                title: Text('${rec.entryId} · ${rec.unowned} · ${rec.nameMoved}'),
                subtitle: Text('${rec.event}\n${rec.hash}'),
                isThreeLine: true,
              ),
            ),
          const SizedBox(height: 24),
          const Text('Apache-2.0 · Aziel Eliab · not a store listing'),
        ],
      ),
    );
  }
}
