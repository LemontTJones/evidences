local framework = {}

function framework.getIdentifier(playerId)
    local player <const> = exports.ND_Core:getPlayer(playerId)
    return player and player.id or nil
end

function framework.getPlayerName(playerId)
    local player <const> = exports.ND_Core:getPlayer(playerId)
    return player and (player.firstname .. " " .. player.lastname) or "undefined"
end

return framework