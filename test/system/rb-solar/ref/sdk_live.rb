# The reference's own Ruby SDK, driven against the generated app.
#
#   RB_SOLAR_SDK=<path to the reference repo's rb/> \
#   RB_SOLAR_BASE=http://127.0.0.1:8901 ruby sdk_live.rb
#
# NOT the SDK's own test suite. That suite runs 246 cases and passes
# WITH THE SERVER TURNED OFF -- 71 skips against a live app, 72 against
# nothing, and two HTTP requests in the whole run: its live mode is
# lenient by design ("synthetic IDs frequently 4xx ... skip rather than
# fail"), and its unit cases speak to a mock transport. As a check that
# an implementation is correct it is worth nothing, so this file is the
# leg instead: the SDK's real client, against the real app, with
# assertions that fail.
#
# What it proves is what the SDK is for: a client generated from the
# same API description talks to this implementation and gets the
# records back.

sdk = ENV["RB_SOLAR_SDK"] or abort("RB_SOLAR_SDK is not set")
base = ENV["RB_SOLAR_BASE"] || "http://127.0.0.1:8901"

$LOAD_PATH.unshift(sdk)
require File.join(sdk, "Solardemo_sdk")

fails = 0

def check(name, want, got)
  if want == got
    puts "  ok   #{name}"
    true
  else
    puts "  FAIL #{name}: wanted #{want.inspect}, got #{got.inspect}"
    false
  end
end

client = SolardemoSDK.new({ "base" => base })

# NOTHING HERE COUNTS ON A FIXED DATABASE. This runs after the
# reference's own validation, which deletes two planets and adds a
# moon; a check that asserted "eight planets" would be asserting the
# order the legs happen to run in. Counts are taken and compared.

# --- list -------------------------------------------------------------
planets = client.Planet.list
before = planets.length
fails += 1 unless check("Planet.list returns records", true, before.positive?)
fails += 1 unless check("and they are records the SDK understands", true,
                        planets.all? { |p| p["id"].is_a?(String) })
fails += 1 unless check("and Earth is among them", true,
                        planets.any? { |p| p["id"] == "earth" })

# --- load -------------------------------------------------------------
earth = client.Planet.load({ "id" => "earth" }).data_get
fails += 1 unless check("Planet.load reads Earth's name", "Earth", earth["name"])
fails += 1 unless check("and its diameter, as a number", 12756, earth["diameter"].to_i)

# --- a nested entity --------------------------------------------------
moons = client.Moon.list({ "planet_id" => "earth" })
fails += 1 unless check("Moon.list is scoped to its planet", true,
                        moons.all? { |m| m["planet_id"] == "earth" })
fails += 1 unless check("and Luna is in it", true,
                        moons.any? { |m| m["id"] == "luna" })

luna = client.Moon.load({ "planet_id" => "earth", "id" => "luna" }).data_get
fails += 1 unless check("Moon.load reads Luna", "Luna", luna["name"])
fails += 1 unless check("and the parent it belongs to", "earth", luna["planet_id"])

# --- create, update, remove -------------------------------------------
made = client.Planet.create({
  "id" => "sdk_probe", "name" => "SDK Probe", "kind" => "rock", "diameter" => 1,
}).data_get
fails += 1 unless check("Planet.create returns the created record", "sdk_probe", made["id"])

client.Planet.update({ "id" => "sdk_probe", "name" => "SDK Probe 2",
                       "kind" => "rock", "diameter" => 2 })
again = client.Planet.load({ "id" => "sdk_probe" }).data_get
fails += 1 unless check("Planet.update persists", "SDK Probe 2", again["name"])

client.Planet.remove({ "id" => "sdk_probe" })
after = client.Planet.list
fails += 1 unless check("Planet.remove leaves what it started with",
                        before, after.length)

# --- the actions the SDK reaches through `direct` ---------------------
res = client.direct({
  "path" => "api/planet/mars/terraform",
  "method" => "POST",
  "params" => {},
  "body" => { "start" => true },
})
fails += 1 unless check("the terraform action answers ok", true, res["ok"])
mars = client.Planet.load({ "id" => "mars" }).data_get
fails += 1 unless check("and the state persists under its wire name",
                        "terraforming", mars["terraformState"])

puts
if fails.zero?
  puts "the reference's Ruby SDK drives the generated app: all checks passed"
  exit 0
end
puts "#{fails} SDK check(s) failed"
exit 1
