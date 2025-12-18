$base = 'http://127.0.0.1:8001'

function PostJson($uri, $body, $token = $null) {
    $headers = @{}
    if ($token) { $headers.Add('Authorization', "Bearer $token") }
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method Post -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json' -Headers $headers
        return @{ ok = $true; body = $resp }
    } catch {
        return @{ ok = $false; error = $_.Exception.Message }
    }
}

function GetJson($uri, $token = $null) {
    $headers = @{}
    if ($token) { $headers.Add('Authorization', "Bearer $token") }
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
        return @{ ok = $true; body = $resp }
    } catch {
        return @{ ok = $false; error = $_.Exception.Message }
    }
}

function PutJson($uri, $body, $token = $null) {
    $headers = @{}
    if ($token) { $headers.Add('Authorization', "Bearer $token") }
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method Put -Body ($body | ConvertTo-Json -Depth 10) -ContentType 'application/json' -Headers $headers
        return @{ ok = $true; body = $resp }
    } catch {
        return @{ ok = $false; error = $_.Exception.Message }
    }
}

function DeleteJson($uri, $token = $null) {
    $headers = @{}
    if ($token) { $headers.Add('Authorization', "Bearer $token") }
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method Delete -Headers $headers
        return @{ ok = $true; body = $resp }
    } catch {
        return @{ ok = $false; error = $_.Exception.Message }
    }
}

Write-Output "=== API test script started ==="

# 1. Create admin user (e_id=1)
$createUserBody = @{ e_id = 1; password = 'password123'; roles = @('Admin'); status = 'active' }
$r = PostJson "$base/Users/create", $createUserBody
Write-Output "Create user response:"
Write-Output ($r | ConvertTo-Json -Depth 5)

# 2. Login
$loginBody = @{ e_id = 1; password = 'password123' }
$r = PostJson "$base/auth/login", $loginBody
if (-not $r.ok) { Write-Output "Login failed: $($r.error)"; exit 1 }
$token = $r.body.access_token
Write-Output "Login succeeded, token length: $($token.Length)"

# 3. Create Task as Admin
$expectedClosure = (Get-Date).AddDays(7).ToString('s')
$taskBody = @{
    title = 'Test Task from PS'
    description = 'This is a test task created during automated tests.'
    priority = 'high'
    expected_closure = $expectedClosure
}
$r = PostJson "$base/Task/create?role=Admin", $taskBody, $token
Write-Output "Create task response:"
Write-Output ($r | ConvertTo-Json -Depth 8)
if (-not $r.ok) { Write-Output "Create task failed: $($r.error)"; exit 1 }
$t = $r.body.task
$t_id = $t.t_id
Write-Output "Created task id: $t_id"

# 4. Get all tasks as Admin
$r = GetJson "$base/Task/getall?role=Admin", $token
Write-Output "Get all tasks response:"
Write-Output ($r | ConvertTo-Json -Depth 8)

# 5. Get task by id
$r = GetJson "$base/Task/get?id=$t_id", $token
Write-Output "Get task by id response:"
Write-Output ($r | ConvertTo-Json -Depth 8)

# 6. Update task (change title & priority)
$updateBody = @{ title = 'Updated Task Title'; priority = 'medium' }
$r = PutJson "$base/Task/update?id=$t_id", $updateBody, $token
Write-Output "Update task response:"
Write-Output ($r | ConvertTo-Json -Depth 8)

# 7. Delete task
$r = DeleteJson "$base/Task/delete?id=$t_id", $token
Write-Output "Delete task response:"
Write-Output ($r | ConvertTo-Json -Depth 5)

Write-Output "=== API test script finished ==="
