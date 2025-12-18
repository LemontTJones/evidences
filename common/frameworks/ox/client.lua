local framework = {}
local ox <const> = require "@ox_core.lib.init"

function framework.getPlayerName()
    local oxPlayer <const> = ox.GetPlayer()
    return oxPlayer and (oxPlayer.get("firstName") .. " " .. oxPlayer.get("lastName")) or nil
end

function framework.getGrade(job)
    local oxPlayer <const> = ox.GetPlayer()
    return oxPlayer and oxPlayer.getGroups()[job] or false
end

return framework