

## Add Cancel Button to Forgot Password Form

Add a "Back to login" text button below the "Send Reset Link" button in the inline forgot password form. Clicking it hides the form and clears reset state.

### Changes

**`src/pages/Login.tsx`** — Add a cancel button after the "Send Reset Link" `<Button>`:

```tsx
<button
  type="button"
  onClick={() => { setShowReset(false); setResetMessage(''); setResetError(''); }}
  className="w-full text-center text-sm text-muted-foreground hover:underline"
>
  Back to login
</button>
```

This goes inside the `{showReset && (...)}` block, after the existing submit button.

