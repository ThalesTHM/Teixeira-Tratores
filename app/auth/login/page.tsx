"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { Suspense, useActionState, useEffect, useState } from 'react';
import { z } from 'zod';
import { loginFormSchema } from '@/lib/validation';
import { toast } from 'sonner';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth'
import { auth } from '@/firebase/firebase';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { createSession } from '@/lib/auth/actions';
import { useSearchParams } from 'next/navigation';
import Login from '@/components/login/Login';

const SignInPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    }>
      <div className="flex items-center justify-center h-screen">
        <Login />
      </div>
    </Suspense>
  )
}

export default SignInPage