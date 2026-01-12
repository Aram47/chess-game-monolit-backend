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

export const MatchMakeAtomicLuaScript = `
	-- KEYS[1] = waiting key
	-- ARGV[1] = userId
	-- ARGV[2] = socketId
	-- ARGV[3] = roomId
	-- ARGV[4] = ttl

	local existingRoom = redis.call(
  	"GET",
  	"chess:user:" .. ARGV[1] .. ":room"
	)

	if existingRoom then
  	return { "ALREADY_IN_ROOM", existingRoom }
	end

	local waiting = redis.call("GET", KEYS[1])

	if not waiting then
  	redis.call("SET", KEYS[1], cjson.encode({
    	userId = ARGV[1],
    	socketId = ARGV[2]
  	}), "EX", ARGV[4])

  	return { "WAIT" }
	end

	local waitingUser = cjson.decode(waiting)

	if waitingUser.userId == ARGV[1] then
  	return { "WAIT" }
	end

	redis.call("DEL", KEYS[1])

	local room = {
  	roomId = ARGV[3],
  	fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  	turn = "white",
  	white = waitingUser,
  	black = {
    	userId = ARGV[1],
    	socketId = ARGV[2]
  	},
  	version = 0,
  	createdAt = tonumber(redis.call("TIME")[1]),
  	allMoves = {}
	}

	redis.call("SET", "chess:room:" .. room.roomId, cjson.encode(room), "EX", ARGV[4])
	redis.call("SET", "chess:user:" .. waitingUser.userId .. ":room", room.roomId, "EX", ARGV[4])
	redis.call("SET", "chess:user:" .. ARGV[1] .. ":room", room.roomId, "EX", ARGV[4])

	return { "MATCH", cjson.encode(room) }
`;

export const FindWaitingRoomAtomicLuaScript = ``;

export const CreateWaitingRoomAtomicLuaScript = `
	-- KEYS[1] = waiting queue
	-- ARGV[1] = userId
	-- ARGV[2] = socketId
	-- ARGV[3] = ttl seconds

	local queueKey = KEYS[1]
	local waitingUser = { userId = ARGV[1], socketId = ARGV[2] }

	local exists = redis.call("GET", queueKey)
	if exists then
  	return { err = "QUEUE_NOT_EMPTY" }
	end

	redis.call("SET", queueKey, cjson.encode(waitingUser), "EX", ARGV[3])
	return { "OK" }
`;

export const RemoveWaitingRoomAtomicLuaScript = `
	-- KEYS[1] = waiting queue
	redis.call("DEL", KEYS[1])
	return { "OK" }
`;

export const FindGameRoomAtomicLuaScript = `
	-- KEYS[1] = room key
	local roomKey = KEYS[1]

	local roomRaw = redis.call("GET", roomKey)
	if not roomRaw then
  	return nil
	end

	return roomRaw
`;

export const CreateGameRoomAtomicLuaScript = `
	-- KEYS[1] = room key
	-- ARGV[1] = room JSON
	-- ARGV[2] = ttl seconds

	local roomKey = KEYS[1]
	local roomJson = ARGV[1]
	local ttl = tonumber(ARGV[2])

	local exists = redis.call("EXISTS", roomKey)
	if exists == 1 then
  	return { err = "ROOM_ALREADY_EXISTS" }
	end

	redis.call("SET", roomKey, roomJson, "EX", ttl)
	return { "OK" }
`;

export const UpdateGameRoomAtomicLuaScript = `
	-- KEYS[1] = room key
	-- ARGV[1] = expected version
	-- ARGV[2] = new room JSON
	-- ARGV[3] = ttl seconds

	local roomKey = KEYS[1]
	local expectedVersion = tonumber(ARGV[1])
	local newRoomJson = ARGV[2]
	local ttl = tonumber(ARGV[3])

	local current = redis.call("GET", roomKey)
	if not current then
  	return { err = "ROOM_NOT_FOUND" }
	end

	local decoded = cjson.decode(current)

	if decoded.version ~= expectedVersion then
  	return { err = "VERSION_CONFLICT" }
	end

	local newDecoded = cjson.decode(newRoomJson)
	newDecoded.version = decoded.version + 1

	redis.call("SET", roomKey, cjson.encode(newDecoded), "EX", ttl)
	return { "OK", newDecoded.version }
`;

export const RemoveGameRoomAtomicLuaScript = `
	-- KEYS[1] = room key
	redis.call("DEL", KEYS[1])
	return { "OK" }
`;
