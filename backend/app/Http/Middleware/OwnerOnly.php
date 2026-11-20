<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OwnerOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->isOwner()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Owner access is required.'], 401);
            }

            return redirect('/owner-login.html');
        }

        return $next($request);
    }
}
