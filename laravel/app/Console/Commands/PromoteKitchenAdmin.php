<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteKitchenAdmin extends Command
{
    protected $signature = 'kitchen:promote-admin {email : The registered customer email to promote}';

    protected $description = 'Promote a registered Our Kitchen customer account to the administrator role.';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $user = User::query()->where('email', $email)->first();

        if (!$user) {
            $this->error('No registered user was found for that email address.');
            return self::FAILURE;
        }

        if ($user->role === 'admin') {
            $this->info("{$user->email} is already an administrator.");
            return self::SUCCESS;
        }

        if (!$this->confirm("Promote {$user->email} to an Our Kitchen administrator?")) {
            $this->warn('No role change was made.');
            return self::SUCCESS;
        }

        $user->forceFill(['role' => 'admin'])->save();
        $this->info("{$user->email} can now sign in to the protected /admin portal.");

        return self::SUCCESS;
    }
}
