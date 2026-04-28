$envVars = @(
  @("TURSO_AUTH_TOKEN", "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU2MjIxNDgsImlkIjoiMDE5ZDY3YzctZjMwMS03NmIzLWE1ZTUtZTdkNWFhZWVhMWRkIiwicmlkIjoiNDljNzAwNzQtOTFhMi00NWNmLWIzNTktNzIxOWViYTVhZDY3In0.CRjtZcXnBQt-KSpkL1j3ZacvZNmHAskapF1Sgvb0ZZoNblXYqq8nV_tHI1oCjDp4lmACKxObvZPe2oFhZTg2Aw"),
  @("NEXT_PUBLIC_SERVER_URL", "https://khomanguon.io.vn"),
  @("NEXT_PUBLIC_API_URL", "https://khomanguon.io.vn"),
  @("NEXTAUTH_URL", "https://khomanguon.io.vn"),
  @("NEXTAUTH_SECRET", "814db8a19310de42cafc16ffa39526e5be5b384c99fa2f468a222f12ab8b6afe"),
  @("AUTH_SECRET", "814db8a19310de42cafc16ffa39526e5be5b384c99fa2f468a222f12ab8b6afe"),
  @("AUTH_TRUST_HOST", "true"),
  @("RESEND_API_KEY", "re_URFidApd_DUZ7QV4NP67PzpM6X2WjxQY3"),
  @("RESEND_FROM_EMAIL", "noreplay@khomanguon.io.vn"),
  @("R2_ACCOUNT_ID", "d0e2768aafbfb45993fcf541f5ffc1e4"),
  @("R2_ACCESS_KEY_ID", "8645a03de3670e257bc319c740057ff0"),
  @("R2_SECRET_ACCESS_KEY", "4db389223498a7c3b61ebbf3869d0f6d0279a6a5759b87abcba71043f114472f"),
  @("R2_BUCKET_NAME", "gamevn"),
  @("R2_PUBLIC_URL", "https://d0e2768aafbfb45993fcf541f5ffc1e4.r2.cloudflarestorage.com/")
)

foreach ($env in $envVars) {
  $key = $env[0]
  $val = $env[1]
  Write-Host "Adding $key to production..."
  npx vercel env add $key production --yes --value "$val" 2>&1 | Out-Null
  Write-Host "  Done"
}

Write-Host "`nAll done! Listing:"
npx vercel env ls
