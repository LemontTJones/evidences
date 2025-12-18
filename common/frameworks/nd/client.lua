local framework = {}

function framework.getPlayerName()
    local player <const> = exports.ND_Core:getPlayer()
    return player and (player.firstname .. " " .. player.lastname) or nil
end

function framework.getGrade(job)
    local player <const> = exports.ND_Core:getPlayer()
    return (player and player.groups[job]) and player.groups[job].rank or false
end

return framework