#!/usr/bin/env node

// Same PORT/HOST the runner script binds to. Hardcoding localhost:8901 meant
// `PORT=9123 npm run validate:full` started a server on 9123, waited for 9123,
// and then validated against 8901 — passing against a different server, or
// failing for the wrong reason.
const BASE_URL =
  process.env.VALIDATE_BASE_URL ||
  `http://${process.env.HOST || 'localhost'}:${process.env.PORT || '8901'}`

interface TestResult {
  name: string
  passed: boolean
  message?: string
}

const results: TestResult[] = []

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`)
  }
}

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`\n=== ${name} ===\n`)
  try {
    await fn()
    results.push({ name, passed: true })
    console.log('✓ PASSED')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    results.push({ name, passed: false, message })
    console.log(`✗ FAILED: ${message}`)
  }
}

async function main() {
  console.log('🚀 Starting API Validation Tests\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  // Test 1: List all planets
  await test('1. List all planets', async () => {
    const res = await fetch(`${BASE_URL}/api/planet`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const planets = await res.json()
    assert(Array.isArray(planets), 'Expected array')
    assert(planets.length === 8, `Expected 8 planets, got ${planets.length}`)
    console.log(`   Found ${planets.length} planets`)
  })

  // Test 2: Get specific planet (Earth)
  await test('2. Get specific planet (Earth)', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/earth`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const planet = await res.json()
    assert(planet.id === 'earth', `Expected id 'earth', got '${planet.id}'`)
    assert(planet.name === 'Earth', `Expected name 'Earth', got '${planet.name}'`)
    assert(planet.kind === 'rock', `Expected kind 'rock', got '${planet.kind}'`)
    assert(planet.diameter === 12756, `Expected diameter 12756, got ${planet.diameter}`)
    console.log(`   Planet: ${planet.name}, diameter: ${planet.diameter}km`)
  })

  // Test 3: Create a new planet (Pluto)
  await test('3. Create a new planet (Pluto)', async () => {
    const res = await fetch(`${BASE_URL}/api/planet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'pluto',
        name: 'Pluto',
        kind: 'rock',
        diameter: 2377,
      }),
    })
    assert(res.status === 201, `Expected 201, got ${res.status}`)
    const planet = await res.json()
    assert(planet.id === 'pluto', 'Planet ID mismatch')
    console.log(`   Created: ${planet.name}`)
  })

  // Test 4: Update planet (Pluto)
  await test('4. Update planet (Pluto)', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/pluto`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'pluto',
        name: 'Pluto (Dwarf Planet)',
        kind: 'rock',
        diameter: 2377,
      }),
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    const planet = await res.json()
    assert(
      planet.name === 'Pluto (Dwarf Planet)',
      `Expected name 'Pluto (Dwarf Planet)', got '${planet.name}'`
    )
    console.log(`   Updated name to: ${planet.name}`)
  })

  // Test 5: Start terraforming Mars
  await test('5. Start terraforming Mars', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/mars/terraform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: true }),
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    const result = await res.json()
    assert(result.ok === true, 'Expected ok: true')
    assert(result.state === 'terraforming', `Expected state 'terraforming', got '${result.state}'`)
    console.log(`   Terraform state: ${result.state}`)
  })

  // Test 6: Verify Mars terraform state persisted
  await test('6. Verify Mars terraform state persisted', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/mars`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const planet = await res.json()
    assert(
      planet.terraformState === 'terraforming',
      `Expected terraformState 'terraforming', got '${planet.terraformState}'`
    )
    console.log(`   Mars terraform state: ${planet.terraformState}`)
  })

  // Test 7: Forbid Venus
  await test('7. Forbid Venus', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/venus/forbid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forbid: true, why: 'Dangerous atmosphere' }),
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    const result = await res.json()
    assert(result.ok === true, 'Expected ok: true')
    assert(result.state === 'forbidden', `Expected state 'forbidden', got '${result.state}'`)
    console.log(`   Forbid state: ${result.state}`)
  })

  // Test 8: Verify Venus forbidden state persisted
  await test('8. Verify Venus forbidden state persisted', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/venus`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const planet = await res.json()
    assert(
      planet.forbidState === 'forbidden',
      `Expected forbidState 'forbidden', got '${planet.forbidState}'`
    )
    assert(
      planet.forbidReason === 'Dangerous atmosphere',
      `Expected forbidReason 'Dangerous atmosphere', got '${planet.forbidReason}'`
    )
    console.log(`   Venus forbid state: ${planet.forbidState}, reason: ${planet.forbidReason}`)
  })

  // Test 9: List moons of Earth
  await test('9. List moons of Earth', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/earth/moon`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const moons = await res.json()
    assert(Array.isArray(moons), 'Expected array')
    assert(moons.length >= 1, `Expected at least 1 moon, got ${moons.length}`)
    console.log(`   Found ${moons.length} moon(s): ${moons.map((m: any) => m.name).join(', ')}`)
  })

  // Test 10: Get specific moon (Luna)
  await test('10. Get specific moon (Luna)', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/earth/moon/luna`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const moon = await res.json()
    assert(moon.id === 'luna', `Expected id 'luna', got '${moon.id}'`)
    assert(moon.name === 'Luna', `Expected name 'Luna', got '${moon.name}'`)
    assert(moon.planet_id === 'earth', `Expected planet_id 'earth', got '${moon.planet_id}'`)
    console.log(`   Moon: ${moon.name}, diameter: ${moon.diameter}km`)
  })

  // Test 11: Create a new moon for Earth
  await test('11. Create a new moon for Earth', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/earth/moon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'luna2',
        name: 'Luna 2',
        planet_id: 'earth',
        kind: 'rock',
        diameter: 100,
      }),
    })
    assert(res.status === 201, `Expected 201, got ${res.status}`)
    const moon = await res.json()
    assert(moon.id === 'luna2', 'Moon ID mismatch')
    console.log(`   Created: ${moon.name}`)
  })

  // Test 12: Verify Earth has 2 moons
  await test('12. Verify Earth has 2 moons', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/earth/moon`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const moons = await res.json()
    assert(moons.length === 2, `Expected 2 moons, got ${moons.length}`)
    console.log(`   Earth now has ${moons.length} moons`)
  })

  // Test 13: Test 404 - Non-existent planet
  await test('13. Test 404 - Non-existent planet', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/nonexistent`)
    assert(res.status === 404, `Expected 404, got ${res.status}`)
    const error = await res.json()
    assert(error.error === 'NotFoundError', 'Expected NotFoundError')
    assert(
      error.message.includes('not found'),
      `Expected 'not found' in message, got '${error.message}'`
    )
    console.log(`   Correctly returned 404: ${error.message}`)
  })

  // Test 14: Test validation error - Missing required field
  await test('14. Test validation error - Missing required field', async () => {
    const res = await fetch(`${BASE_URL}/api/planet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'test', name: 'Test' }),
    })
    assert(res.status === 400, `Expected 400, got ${res.status}`)
    const error = await res.json()
    assert(error.message.includes('kind'), `Expected 'kind' in error message, got '${error.message}'`)
    console.log(`   Correctly returned 400: ${error.message}`)
  })

  // Test 15: Count Jupiter's moons before delete
  let jupiterMoonCount = 0
  await test('15. Count Jupiter moons before delete', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/jupiter/moon`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const moons = await res.json()
    jupiterMoonCount = moons.length
    assert(jupiterMoonCount > 0, `Expected Jupiter to have moons, got ${jupiterMoonCount}`)
    console.log(`   Jupiter has ${jupiterMoonCount} moons`)
  })

  // Test 16: Delete Jupiter (cascade delete test)
  await test('16. Delete Jupiter (cascade delete test)', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/jupiter`, {
      method: 'DELETE',
    })
    assert(res.status === 204, `Expected 204, got ${res.status}`)
    console.log(`   Jupiter deleted successfully`)
  })

  // Test 17: Verify Jupiter is deleted
  await test('17. Verify Jupiter is deleted', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/jupiter`)
    assert(res.status === 404, `Expected 404, got ${res.status}`)
    console.log(`   Jupiter correctly returns 404`)
  })

  // Test 18: Verify Jupiter's moons were cascade deleted
  await test('18. Verify Jupiter moons cascade deleted', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/jupiter/moon/io`)
    assert(res.status === 404, `Expected 404 for deleted moon, got ${res.status}`)
    console.log(`   Jupiter's moons correctly cascade deleted`)
  })

  // Test 19: Delete Pluto (cleanup)
  await test('19. Delete Pluto (cleanup)', async () => {
    const res = await fetch(`${BASE_URL}/api/planet/pluto`, {
      method: 'DELETE',
    })
    assert(res.status === 204, `Expected 204, got ${res.status}`)
    console.log(`   Pluto deleted successfully`)
  })

  // Test 20: Final state - Count remaining planets
  await test('20. Final state - Count remaining planets', async () => {
    const res = await fetch(`${BASE_URL}/api/planet`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    const planets = await res.json()
    assert(planets.length === 7, `Expected 7 planets (8 - Jupiter - Pluto), got ${planets.length}`)
    console.log(`   ${planets.length} planets remaining: ${planets.map((p: any) => p.name).join(', ')}`)
  })

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('VALIDATION SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`✓ Passed: ${passed}`)
  console.log(`✗ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nFailed Tests:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ✗ ${r.name}`)
        console.log(`    ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(60))

  if (failed > 0) {
    process.exit(1)
  } else {
    console.log('\n🎉 All validation tests passed!\n')
    process.exit(0)
  }
}

main().catch((error) => {
  console.error('\n❌ Validation script error:', error)
  process.exit(1)
})
