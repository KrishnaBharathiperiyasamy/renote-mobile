import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Marketplace Query and Matching Logic', () => {
  const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

  it('escapeRegex properly escapes special characters in category/search', () => {
    assert.strictEqual(escapeRegex('Laptops & Computers (Refurbished) + Deals [2026]'), 'Laptops & Computers \\(Refurbished\\) \\+ Deals \\[2026\\]');
  });

  it('category regex matches both primary category and aliases', () => {
    const trimmedCat = 'Electronics';
    let catPatterns = [trimmedCat];
    if (/electronics/i.test(trimmedCat)) {
      catPatterns.push('Electronics & Appliances', 'Laptops & Computers', 'Computers & Laptops', 'Laptops', 'Computers');
    }
    const catRegex = new RegExp(catPatterns.map(escapeRegex).join('|'), 'i');

    assert.ok(catRegex.test('Electronics'));
    assert.ok(catRegex.test('Electronics & Appliances'));
    assert.ok(catRegex.test('Laptops & Computers'));
    assert.ok(catRegex.test('Computers & Laptops'));
    assert.ok(!catRegex.test('Vehicles'));
  });

  it('city regex matches city and locality aliases (RS Puram in Coimbatore)', () => {
    const rawCity = 'Coimbatore';
    const cityPatterns = [rawCity];
    if (/coimbatore/i.test(rawCity)) {
      cityPatterns.push('RS Puram', 'R S PURAM', 'Peelamedu', 'Gandhipuram');
    }
    const cityRegex = new RegExp(cityPatterns.map(escapeRegex).join('|'), 'i');

    assert.ok(cityRegex.test('Coimbatore'));
    assert.ok(cityRegex.test('R S PURAM'));
    assert.ok(cityRegex.test('RS Puram'));
    assert.ok(cityRegex.test('Peelamedu'));
    assert.ok(!cityRegex.test('Chennai'));
  });

  it('frontend client-side city filter matches RS Puram when Coimbatore is selected', () => {
    const testListings = [
      { id: '1', city: 'RS PURAM', address: '123 D.B. Road, RS Puram, Coimbatore - 641002' },
      { id: '2', city: 'BANGALORE', address: 'Indiranagar, Bengaluru' }
    ];

    const activeCity = 'Coimbatore';
    const c = activeCity.toLowerCase().trim();

    const filtered = testListings.filter(p => {
      const cityLow = p.city.toLowerCase();
      const compAddress = p.address.toLowerCase();
      if (cityLow.includes(c) || compAddress.includes(c)) return true;
      if (c.includes('coimbatore') && (cityLow.includes('rs puram') || compAddress.includes('rs puram'))) return true;
      return false;
    });

    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, '1');
  });

  it('frontend client-side city filter displays all listings when All is selected', () => {
    const testListings = [
      { id: '1', city: 'RS PURAM' },
      { id: '2', city: 'BANGALORE' }
    ];

    const activeCity = 'All';
    let filtered = testListings;
    if (activeCity && activeCity !== 'All') {
      const c = activeCity.toLowerCase().trim();
      filtered = filtered.filter(p => p.city.toLowerCase().includes(c));
    }

    assert.strictEqual(filtered.length, 2);
  });

  it('formats whatsapp phone numbers properly without duplicate country code', () => {
    const formatWa = (phone) => {
      const rawWa = (phone || '9092024444').replace(/\D/g, '');
      return rawWa.length === 10 ? `91${rawWa}` : rawWa;
    };

    assert.strictEqual(formatWa('9092024444'), '919092024444');
    assert.strictEqual(formatWa('+91 90920 24444'), '919092024444');
    assert.strictEqual(formatWa('919092024444'), '919092024444');
    assert.strictEqual(formatWa('(909) 202-4444'), '919092024444');
  });
});
