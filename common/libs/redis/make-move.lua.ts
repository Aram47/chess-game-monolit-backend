export const MakeMoveLuaScript = `
	-- KEYS[1] = room key (room:{id})
	-- ARGV[1] = expected version
	-- ARGV[2] = new room json
	-- ARGV[3] = ttl (seconds)

	local roomKey = KEYS[1]
	local expectedVersion = tonumber(ARGV[1])
	local newRoomJson = ARGV[2]
	local ttl = tonumber(ARGV[3])

	local current = redis.call("GET", roomKey)
	if not current then
  	return { err = "ROOM_NOT_FOUND" }
	end

	local decoded = cjson.decode(current)

	-- optimistic concurrency check
	if decoded.version ~= expectedVersion then
  	return { err = "VERSION_CONFLICT" }
	end

	-- increment version inside Redis (source of truth)
	local newDecoded = cjson.decode(newRoomJson)
	newDecoded.version = decoded.version + 1

	redis.call(
  	"SET",
  	roomKey,
  	cjson.encode(newDecoded),
  	"EX",
  	ttl
	)

	return {
  	"OK",
  	newDecoded.version,
  	newDecoded.isGameOver and 1 or 0
	}
`;
